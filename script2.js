//переменная, которая хранит JSON
let http = new XMLHttpRequest();
let mapData;

// переменная, которая хранит div блок с главным SVG
const mapContainer = document.getElementById('floor-map');

// переменная плавающего окошка с описанием кабинетов
const descriptionBlock  = document.getElementById('description');

// переменная блока с текущим номером этажа
const currentFloorBlock = document.getElementById('current-floor')

// переменные увеличения и уменьшения этажа
const floorIncrease = document.getElementById('floorIncrease');
const floorReduce = document.getElementById('floorReduce');

// allRooms-массив из всех комнат этажа, json; currentFloor - текущий этаж, чтобы в дальнейшем его менять
let allRooms = [];
let currentFloor;

//----------------------------------------------------------------------------------------------------------------------

//парсим JSON; устанавливаем текущий этаж на тот, у которого  статус главного этажа; формируем массив из комнат всего этажа
http.open('get', './map/bmstuJson.json', true);
http.send();
http.onload = function () {
   if (this.readyState === 4 && this.status === 200) {
      mapData = JSON.parse(this.responseText);  
      mapData.floors.forEach(floor => {
         if (floor.status.includes('main floor')) {
            currentFloor = mapData.floors.indexOf(floor);
         }
      });

      allRooms = mapData.floors[currentFloor].locations;
      changeCurrentFloorBlock();
      drawFloor();
      checkFloor();
   }
};

// Обработчик событий SVG файла для реагирования комнат на нажатие
mapContainer.addEventListener('click', (event) => {
   // Устанавливаем ссылку на ближайшего родителя нажатого элемента с id = room... (у нас room висит на элементе с тремя дочерними полигонами, поэтому родитель)
   const roomElement = event.target.closest('[id^="room"]');
   SelectRoom(roomElement);
});

// Обработчики событий для смены этажа
floorIncrease.addEventListener('click', () => {changeFloor(1)});
floorReduce.addEventListener('click', () => {changeFloor(-1)});

//--------------------------------------------------------------------------------------------------------------------------------------------------------


// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск)
function SelectRoom(currentRoom) {
   if (currentRoom) {
      //roomId-хранит айди комнаты для дальнейшего поиска в json; roomHasInfo хранит в себе статус того, нашлась информация о комнате или нет, если нет, то мы закрываем окно
      const roomId = currentRoom.getAttribute('id');
      let roomHasInfo = false;

      // Если кликнули по комнате, то проверяем, есть ли сейчас уже есть активная комната, также проверяем, что это не она же сама и в противном случае удаляем у нее active
      const activeRoom = document.querySelector('[id^="room"].active');
      if (activeRoom && activeRoom !== currentRoom) {
         activeRoom.classList.remove('active');
      }
      // Делаем комнату активной и включаем окно с описанием
      currentRoom.classList.add('active');
      show(descriptionBlock);

      // пробегаемся циклом по массиву с комнатами, когда находим нужную нам, берем из нее информацию для описания и вставляем его в div элемент, если информации не нашлось, скрываем окно
      allRooms.forEach(room => {
         if (room.id === roomId) {
            roomHasInfo = true;
            descriptionBlock.innerHTML =
               `<h4>${room.title}</h4>
               <p>${room.about}</p>`;
            
            // функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
            const roomRect = currentRoom.getBoundingClientRect();
            descriptionBlock.style.position = 'absolute';
            descriptionBlock.style.top = `${roomRect.top - 20}px`;
            descriptionBlock.style.left = `${roomRect.left - 120}px`;
         }
      });

      if (!roomHasInfo) {
         hide(descriptionBlock);
      }
   }
   else {
      // Если кликнули не по комнате, то находим комнату с классом active и удаляем его, тем самым, выключая выделение комнаты, также скрываем всплывающее окно с описанием и ставим дефолтное описание, потому что есть баг, когда после комнаты с описанием, тыкаешь на ту, где его нет, она показывает описание из предыдущей комнаты
      const activeElement = document.querySelector('[id^="room"].active');
      if (activeElement) {
         activeElement.classList.remove('active');
         hide(descriptionBlock);
      }
   }
};

// Функция, которая отвечает за поиск комнаты через поле ввода
function searchRoom() {
   // stringId - хранит конечный вариант Id для последующей передачи в функцию SelectRoom(); inputOfSearch - хранит в себе текущее значение строки поиска
   let stringId;
   const inputOfSearch = document.getElementById('roomNumberInput').value;

   if (inputOfSearch === "Актовый зал" && currentFloor === 1) {
      stringId = "room-132_1_";
   }
   else {
      stringId = "room-" + inputOfSearch + "_" + currentFloor + "_";
   }

   const roomElement = document.getElementById(stringId);
   SelectRoom(roomElement);
}

function changeFloor(direction) {
   const floorStatus = mapData.floors[currentFloor].status;

   // после проверки на то, что этаж существует, переключаем его, меняем текст этажа, подгружаем нужный svg файл, переопределяем массив со всеми комнатами этажа и скрываем окно с информацией о комнате, если оно естть
   if ((!floorStatus.includes('ground floor') && direction < 0) || (!floorStatus.includes('last floor') && direction > 0))  {
      currentFloor += direction;
      changeCurrentFloorBlock();
      hide(descriptionBlock);
      drawFloor();

      allRooms = mapData.floors[currentFloor].locations;
   }
   else {
      console.log('такого этажа нет');
   }

   checkFloor();
}

// функция проверки этажа, на то, что нельзя опуститься ниже или подняться выше
function checkFloor() {
   const floorStatus = mapData.floors[currentFloor].status; 

   if(floorStatus.includes("ground floor")) {
      floorReduce.classList.add('disabled');
   }
   else if (floorStatus.includes("last floor")) {
      floorIncrease.classList.add('disabled');
   }
   else {
      floorReduce.classList.remove('disabled');
      floorIncrease.classList.remove('disabled');
   }
}

// Функция отрисовки этажа (основывается на currentFloor)
function drawFloor() {
   fetch(mapData.floors[currentFloor].map)
   .then(response => response.text())
   .then(svg => {
      mapContainer.innerHTML = svg;
   });
}

// Функция смены текста текущего этажа
function changeCurrentFloorBlock() {
   currentFloorBlock.textContent = mapData.floors[currentFloor].title;
}

// фнкции скрытия и показывания элемента
function hide(element) {
   element.style.display = 'none'
}
function show(element) {
   element.style.display = "flex";
}


