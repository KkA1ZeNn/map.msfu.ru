//переменная, которая хранит объект на основе JSON
let mapData;

// переменная, которая хранит div блок с главным SVG
const svgContainer = document.getElementById('mapSvg');

// переменная плавающего окошка с описанием кабинетов
const descriptionBlock  = document.getElementById('description');

// переменная с сылкой на поле поиска и переменная с ссылкой на поле с результатами поиска
const searchInput = document.getElementById('roomSearchInput');
const searchResultBlock = document.getElementById('searchResultBlock');

// переменная блока с текущим номером этажа
const currentFloorBlock = document.getElementById('currentFloor')

// переменные увеличения и уменьшения этажа
const floorIncreaseBtn = document.getElementById('floorIncrease');
const floorReduceBtn = document.getElementById('floorReduce');

//currentFloor - текущий этаж, чтобы в дальнейшем его менять и делать проверку этажа
let currentFloor;

//----------------------------------------------------------------------------------------------------------------------

//парсим JSON; устанавливаем текущий этаж на тот, у которого  статус главного этажа
fetch('./map/bmstuJson.json')
   .then(response => response.json())
   .then(json => {
      mapData = json;
      mapData.floors.forEach(floor => {
         if (floor.status.includes('main floor')) {
            let startFloor = mapData.floors.indexOf(floor);
            changeFloor(startFloor);
         }
      });
   });
   

// Обработчик событий SVG файла для реагирования комнат на нажатие
svgContainer.addEventListener('click', (event) => {
   const roomElement = event.target.closest('[id^="room"]');
   selectRoom(roomElement);
});

// Обработчик событий для тех комнат, которые появились в списке поиска
searchResultBlock.addEventListener('click', (event) => searchResultsClickHandler(event));

// Обработчики событий для смены этажа
floorIncreaseBtn.addEventListener('click', () => {changeFloorButtonHandler(1)});
floorReduceBtn.addEventListener('click', () => {changeFloorButtonHandler(-1)});

// обработчик событий для поиска комнат по описанию
searchInput.addEventListener('input', searchRoom);

//--------------------------------------------------------------------------------------------------------------------------------------------------------


// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск). Проверяем, что искомая комната есть, если есть, то проверка, что это она уже не включена, заполняем 
// блок описания данными из json, смещаем блок описания
function selectRoom(currentRoom) {
   const activeRoom = document.querySelector('[id^="room"].active');
   if (currentRoom) {
      const roomId = currentRoom.getAttribute('id');
      let roomHasInfo = false;
      let currentFLoorRooms =  mapData.floors[currentFloor].locations;

      if (activeRoom && activeRoom !== currentRoom) {
         activeRoom.classList.remove('active');
         hide(descriptionBlock);
      }

      currentRoom.classList.add('active');
      show(descriptionBlock);

      svgContainer.style.transform = `scale(${3})`;

      currentFLoorRooms.forEach(room => {
         if (room.id === roomId) {
            roomHasInfo = true;
            descriptionBlock.innerHTML =
               `<h4>${room.title}</h4>
               <p>${room.about}</p>`;
            
            // функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
            const roomRect = currentRoom.getBoundingClientRect();
            const mapContainer = document.querySelector(".mapContainer");

            if (roomRect.left - descriptionBlock.offsetWidth / 2 < 0){
               descriptionBlock.style.left = `${roomRect.right + 20}px`;
               descriptionBlock.style.top = `${roomRect.bottom + window.scrollY - descriptionBlock.offsetHeight / 2}px`;
            }
            else if (roomRect.right + descriptionBlock.offsetWidth / 2 > mapContainer.offsetWidth) {
               descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth - 20}px`;
               descriptionBlock.style.top = `${roomRect.bottom + window.scrollY - descriptionBlock.offsetHeight / 2}px`;
            }
            else {
               descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth / 2 + roomRect.width / 2}px`;
               descriptionBlock.style.top = `${roomRect.top + window.scrollY - descriptionBlock.offsetHeight - 20}px`;
            }
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

};

// Функция, которая отвечает за поиск комнаты через поле ввода. Здесь фформируется глобальный массив реультатов поиска
// searchResult - массив объектов [строка с id этажа; объект комнаты со всеми полями из json]
function searchRoom() {
   const currentInput = searchInput.value;
   let searchResult = [];

   mapData.floors.forEach(floor => {
      floor.locations.forEach(room => {
         if (room.title.includes(currentInput) || room.about.includes(currentInput) || room.id.includes(currentInput)) {
            searchResult.push({floor: floor.id, room: room});
         }
      });
   });

   showSearchResult(searchResult);
}

// функция отрисовки результатов поиска. Здесь создаются и заполняются содержимым кнопки с комнатами
function showSearchResult(searchResult){
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
function searchResultsClickHandler(event) {

   if (event.target.tagName === 'BUTTON') {
      let elementsFloor;
      
      mapData.floors.forEach(floor => {
         if (floor.id.includes(event.target.dataset.floor))
         {
            elementsFloor = mapData.floors.indexOf(floor);
         }
      });

      if (currentFloor === elementsFloor) {
         const roomElement = document.getElementById(event.target.dataset.room);
         selectRoom(roomElement);
         console.log(currentFloor, elementsFloor);
      }
      else{
         changeFloor(elementsFloor, event.target.dataset.room);
         
         //console.log('СОРИ Я ПОКА НЕ ПОНЯЛ, КАК МЕНЯТЬ ЭТАЖ, НО ЭТО ДОЛЖНО БЫТЬ ТУТ');
      }
   }
}

// функция смены этажа, принимает в себя направление движения (вверх или вниз) (1 или -1). Делаем проверку на допустимость переключения и отрисовывем нужный этаж
function changeFloorButtonHandler(direction) {
   const floorStatus = mapData.floors[currentFloor].status;

   if ((!floorStatus.includes('ground floor') && direction < 0) || (!floorStatus.includes('last floor') && direction > 0)) {
      hide(descriptionBlock);
      changeFloor(currentFloor += direction);
   }
   else {
      console.log('такого этажа нет');
   }

   checkFloorToToggleButton(currentFloor);
}

// функция проверки этажа, на то, что нельзя опуститься ниже или подняться выше
function checkFloorToToggleButton(floor) {
   const floorStatus = mapData.floors[floor].status; 

   if(floorStatus.includes("ground floor")) {
      floorReduceBtn.classList.add('disabled');
   }
   else if (floorStatus.includes("last floor")) {
      floorIncreaseBtn.classList.add('disabled');
   }
   else {
      floorReduceBtn.classList.remove('disabled');
      floorIncreaseBtn.classList.remove('disabled');
   }
}

// Функция отрисовки этажа (основывается на currentFloor)
function drawFloor(floor, room) {
   fetch(mapData.floors[floor].map)
   .then(response => response.text())
   .then(svg => {
      svgContainer.innerHTML = svg;

      setTimeout(() => {
         const myRoom = document.getElementById(room);
         console.log(myRoom);
         selectRoom(myRoom);
      }, 0);
   })
}

function changeFloor(floor, room){
   currentFloor = floor;

   drawFloor(floor, room);
   changeCurrentFloorBlock(floor);
   checkFloorToToggleButton(floor);
}

// Функция смены текста текущего этажа
function changeCurrentFloorBlock(floor) {
   currentFloorBlock.textContent = mapData.floors[floor].title;
}

// фнкции скрытия и показывания элемента
function hide(element) {
   element.style.display = 'none'
}
function show(element) {
   element.style.display = "flex";
}






