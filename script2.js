//переменная, которая хранит JSON
let http = new XMLHttpRequest();
let mapData;

// переменная, которая хранит div блок с главным SVG
const mapContainer = document.getElementById('floor-map');

// переменная плавающего окошка с описанием кабинетов
const descriptionBlock  = document.getElementById('description');

// переменная с сылкой на поле поиска и переменная с ссылкой на поле с результатами поиска
const searchInput = document.getElementById('roomSearchInput');
const searchResultBlock = document.getElementById('searchResultBlock');

// переменная блока с текущим номером этажа
const currentFloorBlock = document.getElementById('current-floor')

// переменные увеличения и уменьшения этажа
const floorIncrease = document.getElementById('floorIncrease');
const floorReduce = document.getElementById('floorReduce');

// allRooms-массив из всех комнат этажа, json; currentFloor - текущий этаж, чтобы в дальнейшем его менять и делать проверку этажа
// searchResult - массив объектов [строка с id этажа; объект комнаты со всеми полями из json]
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
            drawFloor(mapData.floors.indexOf(floor));
         }
      });
   }
};

// Обработчик событий SVG файла для реагирования комнат на нажатие
mapContainer.addEventListener('click', (event) => {
   const roomElement = event.target.closest('[id^="room"]');
   selectRoom(roomElement);
});

// Обработчик событий для тех комнат, которые появились в списке поиска
searchResultBlock.addEventListener('click', (event) => findRoomAfterClick(event));

// Обработчики событий для смены этажа
floorIncrease.addEventListener('click', () => {changeFloor(1)});
floorReduce.addEventListener('click', () => {changeFloor(-1)});

// обработчик событий для поиска комнат по описанию
searchInput.addEventListener('input', searchRoom);

//--------------------------------------------------------------------------------------------------------------------------------------------------------


// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск). Проверяем, что искомая комната есть, если есть, то проверка, что это она уже не включена, заполняем 
// блок описания данными из json, смещаем блок описания
function selectRoom(currentRoom) {
   console.log("Select room start");
   const activeRoom = document.querySelector('[id^="room"].active');
   if (currentRoom) {
      const roomId = currentRoom.getAttribute('id');
      let roomHasInfo = false;

      if (activeRoom && activeRoom !== currentRoom) {
         activeRoom.classList.remove('active');
         hide(descriptionBlock);
      }

      currentRoom.classList.add('active');
      show(descriptionBlock);

      allRooms.forEach(room => {
         if (room.id === roomId) {
            roomHasInfo = true;
            descriptionBlock.innerHTML =
               `<h4>${room.title}</h4>
               <p>${room.about}</p>`;
            
            // функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
            const roomRect = currentRoom.getBoundingClientRect();
            const width = (roomRect.right - roomRect.left) / 2;
            const height = (roomRect.bottom - roomRect.top) / 2;
            descriptionBlock.style.position = 'absolute';
            descriptionBlock.style.top = `${roomRect.top - descriptionBlock.offsetHeight - height}px`;
            descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth / 2 + width}px`;
         }
      });

      if (!roomHasInfo) {
         hide(descriptionBlock);
      }
   }
   else {
      if (activeRoom) {
         activeRoom.classList.remove('active');
         hide(descriptionBlock);
      }
   }
   console.log("Select room end");
};

// Функция, которая отвечает за поиск комнаты через поле ввода. Здесь фформируется глобальный массив реультатов поиска
function searchRoom() {
   const currentInput = searchInput.value;
   searchResult = [];

   mapData.floors.forEach(floor => {
      floor.locations.forEach(room => {
         if (room.title.includes(currentInput) || room.about.includes(currentInput) || room.id.includes(currentInput)) {
            searchResult.push({floor: floor.id, room: room});
         }
      });
   });
   showSearchResult();
}

// функция отрисовки результатов поиска. Здесь создаются и заполняются содержимым кнопки с комнатами
function showSearchResult(){
   searchResultBlock.innerHTML = '';

   searchResult.forEach(element => {
      const variant = document.createElement('button');

      variant.dataset.floor = element.floor;
      variant.dataset.room = element.room.id;

      variant.classList.add('searchResultBlock_item');
      variant.innerHTML =
         `<h5>${element.room.id}</h5>
         <p>${element.room.title}</p>`;
         searchResultBlock.appendChild(variant);
   });
}

// функция поиска комнаты после клика по кнопке комнаты в списке. Если комната на текущем этаже, то сразу ищем, если нет, то надо отрисовать нужный этаж и найти там
function findRoomAfterClick(event) {
   let elementsFloor;

   if (event.target.tagName === 'BUTTON') {
      mapData.floors.forEach(floor => {
         if (floor.id.includes(event.target.dataset.floor))
         {
            elementsFloor = mapData.floors.indexOf(floor);
         }
      });

      if (currentFloor === elementsFloor) {
         const roomElement = document.getElementById(event.target.dataset.room);
         selectRoom(roomElement);
      }
      else{
         drawFloor(elementsFloor, function(){
            const roomElement = document.getElementById(event.target.dataset.room);
            console.log(roomElement);
            selectRoom(roomElement);
         });


         
         

         //console.log('СОРИ Я ПОКА НЕ ПОНЯЛ, КАК МЕНЯТЬ ЭТАЖ, НО ЭТО ДОЛЖНО БЫТЬ ТУТ');
      }
   }
}

// функция смены этажа, принимает в себя направление движения (вверх или вниз) (1 или -1). Делаем проверку на допустимость переключения и отрисовывем нужный этаж
function changeFloor(direction) {
   const floorStatus = mapData.floors[currentFloor].status;

   if ((!floorStatus.includes('ground floor') && direction < 0) || (!floorStatus.includes('last floor') && direction > 0)) {
      currentFloor += direction;
      hide(descriptionBlock);
      drawFloor(currentFloor);
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
function drawFloor(floor) {
   console.log("-----------------------------------------------------------------------------\nDraw floor start");
   currentFloor = floor;

   fetch(mapData.floors[currentFloor].map)
   .then(response => response.text())
   .then(svg => {
      mapContainer.innerHTML = svg;
   });

   allRooms = mapData.floors[currentFloor].locations;
   changeCurrentFloorBlock();
   checkFloor();
   console.log("Draw floor end");

   if (arguments.length === 2) {
      let tempFun = arguments[1];
      tempFun();
   }
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


