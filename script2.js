//переменная, которая хранит объект на основе JSON
let mapData;

//-----------
let svg;
let instance;
//-----------

// переменная, которая хранит div блок с главным SVG
const svgContainer = document.getElementById('mapSvg');

// базовый URL страницы, параметры URL и id комнаты из URL
const baseUrl = window.location.href.split('?')[0];
const urlParams = new URLSearchParams(window.location.search);
const roomFromUrl = urlParams.get('location');

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
      if (!roomFromUrl) {
         mapData.floors.forEach((floor, i) => {
            if (floor.status === 'main floor') {
               changeFloor(i);
            }
         });
      } else {
         mapData.floors.forEach((floor, i) => {
            floor.locations.forEach(room => {
               if (room.id === roomFromUrl) {
                  changeFloor(i);
               }
            });
         });
      }
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
         disable(descriptionBlock);
      }

      currentRoom.classList.add('active');
      updateUrl(currentRoom.id);
      enable(descriptionBlock);

      //--------------

      const roomRect1 = currentRoom.getBoundingClientRect();
      const roomRect2 = newSvg.getBoundingClientRect(); 
      console.log('svg = ', roomRect2.x, roomRect2.y + window.scrollY);
      console.log('room = ', roomRect1.x, roomRect1.y + window.scrollY);
      console.log(instance.getTransform());
      console.log('---------------------------------------');
      
      //instance.zoomTo(roomRect1.x - 200, roomRect1.y + 50, 4); 900 250   860 170 при зуме -- room
      //instance.moveTo(900, 250)   -1145 -1470      центр в -1711 -933
      //console.log(roomRect1.right - roomRect1.x, roomRect1.bottom - roomRect1.y);
      //804 417      750 417        1318 206
      //500 80       500 80         500  80
      //-304 -338    -250 -337      -818 -126

      //0 0 1 -220 -306        

      //instance.moveTo(0, 0);
      //instance.zoomTo(0, 0, 1 / info.scale);
      //console.log(instance.getTransform());
      
      //instance.moveTo(620 - roomRect1.x - (roomRect1.right - roomRect1.left) / 2, 130 - roomRect1.y - (roomRect1.bottom - roomRect1.top) / 2 - window.scrollY );
      //instance.smoothZoom(0, 0, 2.5);

      //-----------------
   
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
         disable(descriptionBlock);
      }
   } else {
      if (activeRoom) {
         activeRoom.classList.remove('active');
         disable(descriptionBlock);
         resetUrl();
         //-------
         //instance.moveTo(0, 0);
         //instance.zoomTo(0, 0, 0.4);
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

// функция смены этажа, в ней происходиь проверка, загрузка нужной svg, отключение кнопок + и - ,а также выделение комнаты, если есть id в url
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

      disable(descriptionBlock);

      enable(floorReduceBtn);
      enable(floorIncreaseBtn);

      if (floor === 0) {
         disable(floorReduceBtn);
      } else if (floor === floorsList.length - 1) {
         disable(floorIncreaseBtn);
      }
   }

   //--------
   newSvg = document.getElementById('Слой_1');
   instance = panzoom(newSvg, {
      maxZoom: 2.5,
      minZoom: 1,
      zoomDoubleClickSpeed: 1, 
   });
   //--------

   if (roomFromUrl) {
      const roomElement = document.getElementById(roomFromUrl);
      if (roomElement) {
         selectRoom(roomElement);
      }
   }

   //PS: почему не получается вставить эти функции в условие?
}

// фнкции скрытия и показывания элемента
function disable(element) {
   element.classList.add('disabled');
}
function enable(element) {
   element.classList.remove('disabled');
}

// Функции для обновления и сброса URL при поиске комнат
function updateUrl(roomId) {
   const newUrl = baseUrl + '?location=' + roomId;
   history.pushState( { roomId } , '', newUrl);
}
function resetUrl() {
   history.pushState( { roomId: null } , '', baseUrl);
}
