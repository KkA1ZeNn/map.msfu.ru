"use strict";

//переменная, которая хранит объект на основе JSON
let mapData;

//-----------
let svg;
let instance;
//-----------

// переменная, которая хранит div блок с главным SVG
const svgContainer = document.querySelector('#mapSvg');
const mapBlock = document.querySelector('#mapblock');

// базовый URL страницы
const baseUrl = window.location.href.split('?')[0];

// переменная плавающего окошка с описанием кабинетов
const descriptionBlock  = document.querySelector('#description');

// переменная с сылкой на поле поиска и переменная с ссылкой на поле с результатами поиска
const searchInput = document.querySelector('#roomSearchInput');
const searchResultBlock = document.querySelector('#searchResultBlock');
const searchParams = ['id', 'title', 'about'];
let categoriesAndRoomsList;

// переменная блока с текущим номером этажа
const currentFloorBlock = document.querySelector('#currentFloor')

// переменные кнопок увеличения и уменьшения этажа
const floorIncreaseBtn = document.querySelector('#floorIncrease');
const floorReduceBtn = document.querySelector('#floorReduce');

// переменные для выбора категории
const choosenCategoryBlock = document.querySelector('#categoriesChoosen_item');
const choosenCategoryTextBlock = document.querySelector('#categoriesChoosen_item_text');
const closeChoosenCategoryButton = document.querySelector('#categoriesChoosen_item_button');
let choosenCategory;

//текущий этаж, чтобы в дальнейшем его менять и делать проверку этажа
let currentFloor;

//----------------------------------------------------------------------------------------------------------------------

//парсим JSON; устанавливаем текущий этаж на тот, у которого  статус главного этажа
fetch('./map/bmstuJson.json')
   .then((response) => {
      if (response.ok) {
         return response;
      } else {
         let error = new Error(response.statusText);
         error.response = response;
         throw error
      }
   })
   .then(response => response.json())
   .then(json => {
      mapData = json;
      //Формируем масси из комнат и категорий, можно вынести в отдельную функцию
      categoriesAndRoomsList = mapData.categories.map(categories => ({category: categories})).concat(
         mapData.floors.flatMap(floor => floor.locations.map(locations => ({
            floor: floor.id,
            room: locations
      }))));

      const roomIdFromUrl = checkURL();
      if (roomIdFromUrl) {
         selectRoom(roomIdFromUrl);
      } else {
         mapData.floors.forEach((floor, i) => {
            if (floor.status === 'main floor') {
               setFloor(i);
            }
         });
      }

      //--------
      instance = panzoom(svgContainer, {
         maxZoom: 2.5,
         minZoom: 1,
         zoomDoubleClickSpeed: 1
      });
      //--------

      formSearchResultList(searchParams);
   })
   .catch(e => {
      console.log('Error: ' + e.message);
   });

// Обработчик событий SVG файла для реагирования комнат на нажатие
svgContainer.addEventListener('click', (event) => {
   const roomElement = event.target.closest('[id^="room"]');
   if (roomElement) {
      selectRoom(roomElement.getAttribute('id'));
   } else {
      resetUrl();
      resetZoom();
      const activeRoom = document.querySelector('[id^="room"].active');
      if (activeRoom) {
         removeSelectRoom(activeRoom);
      }
   }
});

// Обработчик событий для тех комнат, которые появились в списке поиска
searchResultBlock.addEventListener('click', (event) => searchResultsClickHandler(event));

// Обработчики событий для смены этажа
floorIncreaseBtn.addEventListener('click', async () => { 
   await setFloor(currentFloor + 1);
   const roomFromUrl = document.querySelector( '#' + checkURL() );
   console.log(roomFromUrl);
   if(roomFromUrl) {
      selectRoom(roomFromUrl.getAttribute('id'));
   }
});
floorReduceBtn.addEventListener('click', async () => { 
   await setFloor(currentFloor - 1);
   const roomFromUrl = document.querySelector( '#' + checkURL() );
   console.log(checkURL());
   console.log(roomFromUrl);
   if(roomFromUrl) {
      selectRoom(roomFromUrl.getAttribute('id'));
   }
});

// обработчик событий для поиска комнат по описанию
searchInput.addEventListener('input', debounce(() => { formSearchResultList(searchParams) }, 700));

closeChoosenCategoryButton.addEventListener('click', () => {
   choosenCategory = "";
   hide(choosenCategoryBlock);
   formSearchResultList(searchParams);
});

//window.addEventListener ("popstate", () => { 
//   const locationFromUrl = window.location.href.split('?')[1];

//   if (locationFromUrl) {
//      selectRoom(locationFromUrl.replace('location=', ''), true);
//   } else {
//      const activeRoom = document.querySelector('[id^="room"].active');

//      if (activeRoom) {
//         removeSelectRoom(activeRoom);
//      }

//      resetZoom();
//   }
//});

//--------------------------------------------------------------------------------------------------------------------------------------------------------


// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск). 
//Проверяем, что искомая комната есть, если есть, то проверка, что это она уже не включена,  
// заполняем блок описания данными из json, смещаем блок описания
async function selectRoom(roomID, flagOfUrl) {
   let roomElement = document.querySelector('#' + roomID);
   if (!roomElement) {
      for (const floor of mapData.floors) {
         for (const location of floor.locations) {
            if (location.id.includes(roomID)) {
               await setFloor(mapData.floors.indexOf(floor));
            }
         }
      }
      roomElement = document.querySelector('#' + roomID);
   };

   const activeRoom = document.querySelector('[id^="room"].active');   
   const currentFLoorRooms =  mapData.floors[currentFloor].locations;

   if (activeRoom && activeRoom !== roomElement) {
      removeSelectRoom(activeRoom);
   }

   roomElement.classList.add('active');
   zoomRoom(roomElement);

   if (!flagOfUrl) {
      updateUrl(roomID);
   }

   currentFLoorRooms.forEach(room => {
      if (room.id === roomID) {
         showDescriptionBlock(roomElement, room.title, room.about);
      }
   });
};

//Функция зумирования на комнату, вычисляет смещение свг, так чтобы комната оказалась в центре контейнера, учитывая уже сделанное смещение, плюс производит увеличение в центр этого контейнера
function zoomRoom(currentRoom) {
   const roomRect = currentRoom.getBoundingClientRect();
   const containerRect = mapBlock.getBoundingClientRect();

   const containerCenterX = containerRect.left + (containerRect.right - containerRect.left) / 2;
   const containerCenterY = containerRect.top + (containerRect.bottom - containerRect.top) / 2 + window.scrollY;
   const roomCenterX = roomRect.left + (roomRect.right - roomRect.left) / 2;
   const roomCenterY = roomRect.top + (roomRect.bottom - roomRect.top) / 2 + window.scrollY;
   const currentTransform = instance.getTransform();
  
   const moveToX = containerCenterX - roomCenterX;
   const moveToY = containerCenterY - roomCenterY;
   
   instance.moveTo(currentTransform.x + moveToX, currentTransform.y + moveToY);
   instance.zoomTo(containerRect.width / 2, containerRect.height / 2, 2.5);
}

function showDescriptionBlock(currentRoom, title, about) {
   show(descriptionBlock);

   descriptionBlock.innerHTML =
      `<h4>${title}</h4>
      <p>${about}</p>`;

   // функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
   const roomRect = currentRoom.getBoundingClientRect();
   const mapContainer = document.querySelector(".mapContainer");

   if (roomRect.left - descriptionBlock.offsetWidth / 2 < 0){
      descriptionBlock.style.left = `${roomRect.right + 20}px`;
      descriptionBlock.style.top = `${roomRect.bottom + window.scrollY - descriptionBlock.offsetHeight / 2}px`;
   } else if (roomRect.right + descriptionBlock.offsetWidth / 2 > mapContainer.offsetWidth) {
      descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth - 20}px`;
      descriptionBlock.style.top = `${roomRect.bottom + window.scrollY - descriptionBlock.offsetHeight / 2}px`;
   } else {
      descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth / 2 + roomRect.width / 2}px`;
      descriptionBlock.style.top = `${roomRect.top + window.scrollY - descriptionBlock.offsetHeight - 20}px`;
   }
}

function removeSelectRoom(activeRoom) {
   activeRoom.classList.remove('active');
   hide(descriptionBlock);
}

function resetZoom() {
   instance.zoomTo(0, 0, 0.4);
   instance.moveTo(0, 0);
}

function formSearchResultList(parameters) {
   const textInput = searchInput.value.toLowerCase();
   let SearchResultList;

   if (choosenCategory) {
      if (textInput === "") {
         SearchResultList = categoriesAndRoomsList.filter(item => {
            if (item.room && item.room.category) {
               return item.room.category === choosenCategory;
            }
         });
      } else {
         SearchResultList = categoriesAndRoomsList.filter(item => {
            if (item.room && item.room.category && item.room.category === choosenCategory) {
               for (let i = 0; i < parameters.length; ++i) {
                  if (item.room[parameters[i]] && item.room[parameters[i]].toLowerCase().includes(textInput)) {
                     return true;
                  }
               }
            }
         });
      }
   } else {
      if (textInput === "") {
         SearchResultList = mapData.categories.map(item => {
            return {category: item};
         });
      }
      else {
         SearchResultList = categoriesAndRoomsList.filter(item => {
            if(item.category) {
               for (let i = 0; i < parameters.length; ++i) {
                  if (item.category[parameters[i]] && item.category[parameters[i]].toLowerCase().includes(textInput)) {
                     return true;
                  }
               }
               return false;
            } else {
               for (let i = 0; i < parameters.length; ++i) {
                  if (item.room[parameters[i]] && item.room[parameters[i]].toLowerCase().includes(textInput)) {
                     return true;
                  }
               }
               return false;
            }
         });
      }
   }

   showSearchResult(SearchResultList);
}

// функция отрисовки результатов поиска. Здесь создаются и заполняются содержимым кнопки с комнатами
function showSearchResult(searchResult) {
   searchResultBlock.innerHTML = '';

   searchResult.forEach(element => {
      const variant = document.createElement('button');
      variant.classList.add('searchResultBlock_item');

      if (element.category) {
         variant.dataset.categoryId = element.category.id;
         variant.dataset.title = element.category.title;
         variant.dataset.about = element.category.about;
         variant.innerHTML =
            `<h5>${element.category.id}</h5>
            <p>${element.category.title}</p>`;
      } else {
         variant.dataset.floor = element.floor;
         variant.dataset.room = element.room.id;
         variant.innerHTML =
            `<h5>${element.room.id}</h5>
            <p>${element.room.title}</p>`;
      }

      searchResultBlock.appendChild(variant);
   });
}

// функция поиска комнаты после клика по кнопке комнаты в списке. Если комната на текущем этаже, то сразу ищем, если нет, то надо отрисовать нужный этаж и найти там
function searchResultsClickHandler(event) {
   if (event.target.tagName === 'BUTTON') {
      if(event.target.dataset.categoryId) {
         choosenCategory = event.target.dataset.categoryId;
         searchInput.value = "";
         show(choosenCategoryBlock);
         formSearchResultList(searchParams);

         choosenCategoryTextBlock.innerHTML =
               `<h5>${event.target.dataset.title}</h5>
               <p>${event.target.dataset.about}</p>`;
      } else {
         selectRoom(event.target.dataset.room);
      }
   }
}

// функция смены этажа, в ней происходиь проверка, загрузка нужной svg, отключение кнопок + и - ,а также выделение комнаты, если есть id в url
async function setFloor(floor) {
   let floorsList = mapData.floors;
   
   if (floor < 0 || floor >= floorsList.length) {
      console.log('такого этажа нет');
   } else {
      try {
         let response = await fetch(floorsList[floor].map);

         if (!response.ok) {
            let error = new Error(response.statusText);
            error.response = response;
            throw error;
         }

         let svg = await response.text();
         svgContainer.innerHTML = svg;

      } catch(e) {
         console.log('Error: ' + e.message);
      }
      
      currentFloor = floor;
      currentFloorBlock.textContent = floorsList[floor].title;

      hide(descriptionBlock);
      enable(floorReduceBtn);
      enable(floorIncreaseBtn);

      if (floor === 0) {
         disable(floorReduceBtn);
      } else if (floor === floorsList.length - 1) {
         disable(floorIncreaseBtn);
      }
   }
}

// функции скрытия и показывания элемента
function disable(element) {
   element.disabled = true;
}
function enable(element) {
   element.disabled = false;
}

function hide(element) {
   element.classList.add('hidden');
}
function show(element) {
   element.classList.remove('hidden');
}

// Функции для обновления и сброса URL при поиске комнат
function updateUrl(roomId) {
   const newUrl = baseUrl + '?location=' + roomId;
   history.replaceState( { roomId } , '', newUrl);
}
function resetUrl() {

   history.replaceState( { roomId: null } , '', baseUrl);
}

function debounce(func, ms) {
   let timeout;
   return function() {
     clearTimeout(timeout);
     timeout = setTimeout(() => func.apply(this, arguments), ms);
   };
}

function checkURL() {
   const urlParams = new URLSearchParams(window.location.search);
   const roomIdFromUrl = urlParams.get('location');
   let result;
   if (roomIdFromUrl) {
      categoriesAndRoomsList.forEach(element => {
         if (element.room) {
            if (element.room.id === roomIdFromUrl) {
               result = roomIdFromUrl;
            }
         }
      });

      if (!result) {
         console.log('Такой комнаты нет');
      }
   } 
   
   return result;
}

