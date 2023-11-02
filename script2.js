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

// переменные кнопок увеличения и уменьшения этажа
const floorIncreaseBtn = document.getElementById('floorIncrease');
const floorReduceBtn = document.getElementById('floorReduce');

//текущий этаж, чтобы в дальнейшем его менять и делать проверку этажа
let currentFloor;

//----------------------------------------------------------------------------------------------------------------------

//парсим JSON; устанавливаем текущий этаж на тот, у которого  статус главного этажа
fetch('./map/bmstuJson.json')
   .then(response => response.json())
   .then(json => {
      mapData = json;
      mapData.floors.forEach((floor, i) => {
         if (floor.status === 'main floor') {
            changeFloor(i);
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
floorIncreaseBtn.addEventListener('click', () => { changeFloor(currentFloor + 1) });
floorReduceBtn.addEventListener('click', () => { changeFloor(currentFloor - 1) });

// обработчик событий для поиска комнат по описанию
searchInput.addEventListener('input', searchRoom);

let instance = panzoom(svgContainer, {
   maxZoom: 4,
   minZoom: 1
});

//--------------------------------------------------------------------------------------------------------------------------------------------------------

// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск). 
//Проверяем, что искомая комната есть, если есть, то проверка, что это она уже не включена,  
// заполняем блок описания данными из json, смещаем блок описания
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
      //show(descriptionBlock);

      //const roomRect1 = currentRoom.getBoundingClientRect();
      //console.log(roomRect1.x, roomRect1.y);
      //instance.zoomTo(roomRect1.x - 200, roomRect1.y + 50, 4);
      
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
         if (
            room.title.includes(currentInput) ||
            room.about.includes(currentInput) || 
            room.id.includes(currentInput)
         ) {
            searchResult.push( {floor: floor.id, room: room} );
         }
      });
   });

   showSearchResult(searchResult);
}

// функция отрисовки результатов поиска. Здесь создаются и заполняются содержимым кнопки с комнатами
function showSearchResult(searchResult) {
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
async function searchResultsClickHandler(event) {

   if (event.target.tagName === 'BUTTON') {
      let elementsFloor;
      
      mapData.floors.forEach(floor => {
         if (floor.id.includes(event.target.dataset.floor)) {
            elementsFloor = mapData.floors.indexOf(floor);
         }
      });

      if (currentFloor !== elementsFloor) {
         await changeFloor(elementsFloor);
      }
      
      const roomElement = document.getElementById(event.target.dataset.room);
      selectRoom(roomElement);
   }
}

async function changeFloor(floor) {
   let floorsList = mapData.floors;
   
   if (floor < 0 || floor >= floorsList.length) {
      console.log('такого этажа нет');
   } else {
      let response = await fetch(floorsList[floor].map);
      let svg = await response.text();

      svgContainer.innerHTML = svg;

      currentFloor = floor;
      currentFloorBlock.textContent = floorsList[floor].title;

      hide(descriptionBlock);

      floorReduceBtn.classList.remove('disabled');
      floorIncreaseBtn.classList.remove('disabled');

      if (floor === 0) {
         floorReduceBtn.classList.add('disabled');
      } else if (floor === floorsList.length - 1) {
         floorIncreaseBtn.classList.add('disabled');
      }
   }
}

// фнкции скрытия и показывания элемента
function hide(element) {
   element.style.display = 'none'
}
function show(element) {
   element.style.display = "flex";
}
