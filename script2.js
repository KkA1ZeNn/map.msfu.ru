//переменная, которая хранит JSON
let http = new XMLHttpRequest();
let mapData;

// переменная, которая хранит div блок с главным SVG
const mapContainer = document.getElementById('floor-map');

// переменная плавающего окошка с описанием кабинетов
const descriptionBlock  = document.getElementById('description');

// переменная с сылкой на поле поиска и переменная с ссылкой на поле с результатами поиска
const searchLabel = document.getElementById('roomSearchInput');
const searchVariants = document.getElementById('searchVariants');

// переменная блока с текущим номером этажа
const currentFloorBlock = document.getElementById('current-floor')

// переменные увеличения и уменьшения этажа
const floorIncrease = document.getElementById('floorIncrease');
const floorReduce = document.getElementById('floorReduce');

// allRooms-массив из всех комнат этажа, json; currentFloor - текущий этаж, чтобы в дальнейшем его менять
// searchResult - массив объектов класса searchResultItem [строка с id этажа, для дальнейшего переключения; объект комнаты со всеми полями]
let allRooms = [];
let currentFloor;
let searchResult = [];

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
   selectRoom(roomElement);
});

// Обработчик событий для тех комнат, которые появились в списке поиска
searchVariants.addEventListener('click', (event) => findRoomAfterClick(event));

// Обработчики событий для смены этажа
floorIncrease.addEventListener('click', () => {changeFloor(1)});
floorReduce.addEventListener('click', () => {changeFloor(-1)});

// обработчик событий для поиска комнат по описанию
searchLabel.addEventListener('input', searchRoom);

//--------------------------------------------------------------------------------------------------------------------------------------------------------


// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск)
function selectRoom(currentRoom) {
   const activeRoom = document.querySelector('[id^="room"].active');
   if (currentRoom) {
      //roomId-хранит айди комнаты для дальнейшего поиска в json; roomHasInfo хранит в себе статус того, нашлась информация о комнате или нет, если нет, то мы закрываем окно
      const roomId = currentRoom.getAttribute('id');
      let roomHasInfo = false;

      // Если кликнули по комнате, то проверяем, есть ли сейчас уже есть активная комната, также проверяем, что это не она же сама и в противном случае удаляем у нее active
      if (activeRoom && activeRoom !== currentRoom) {
         activeRoom.classList.remove('active');
         hide(descriptionBlock);
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
      // Если кликнули не по комнате, то находим комнату с классом active и удаляем его, тем самым, выключая выделение комнаты, также скрываем всплывающее окно с описанием
      if (activeRoom) {
         activeRoom.classList.remove('active');
         hide(descriptionBlock);
      }
   }
};

// Функция, которая отвечает за поиск комнаты через поле ввода
function searchRoom() {
   const currentInput = searchLabel.value;
   class searchResultItem {
      constructor(floor, roomObj) {
        this.floor = floor;
        this.room = roomObj;
      }
    }
   searchResult = [];

   // формируем массив
   mapData.floors.forEach(floor => {
      floor.locations.forEach(room => {
         if (room.title.includes(currentInput) || room.about.includes(currentInput)) {
            searchResult.push(new searchResultItem(floor.id, room));
         }
      });
   });
   changeSearchLabel();
}

// функция изменения поля с результатами поиска
function changeSearchLabel(){
   let idCounter = 0;

   // удаляем всё, что есть в списке поиска
   searchVariants.innerHTML = '';

   // создаем div блоки с автоинкрементированным id и с заданными h5 и p, полученными из массива, который передается в функцию из функции поиска
   searchResult.forEach(element => {
      const variant = document.createElement('div');

      variant.id = "row-" + idCounter;
      ++idCounter;

      variant.classList.add('searchVariants_variant');
      variant.innerHTML =
         `<h5>${element.room.title}</h5>
         <p>${element.room.about}</p>`;
      searchVariants.appendChild(variant);
   });
}

// функция поиска комнаты после клика в списке комнат. Если комната на текущем этаже, то сразу ищем, если нет, то надо отрисовать нужный этаж и найти там
function findRoomAfterClick(event) {
   const clickedVariant = event.target.closest('[id^="row-"]');
   const idToFindInArray = clickedVariant.id.substring(4);
   let elementsFloor;

   mapData.floors.forEach(floor => {
      if (floor.id.includes(searchResult[idToFindInArray].floor))
      {
         elementsFloor = mapData.floors.indexOf(floor);
      }
   });
   
   if (currentFloor === elementsFloor) {
      const roomElement = document.getElementById(searchResult[idToFindInArray].room.id);
      selectRoom(roomElement);
   }
   else{
      console.log('СОРИ Я ПОКА НЕ ПОНЯЛ, КАК МЕНЯТЬ ЭТАЖ, НО ЭТО ДОЛЖНО БЫТЬ ТУТ');
   }
}

// функция смены этажа, принимает в себя направление движения (вверх или вниз) (1 или -1)
function changeFloor(direction) {
   const floorStatus = mapData.floors[currentFloor].status;

   // после проверки на то, что этаж существует, переключаем его, меняем текст этажа, подгружаем нужный svg файл, переопределяем массив со всеми комнатами этажа и скрываем окно с информацией о комнате, если оно естть
   if ((!floorStatus.includes('ground floor') && direction < 0) || (!floorStatus.includes('last floor') && direction > 0)) {
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


