//переменная, которая хранит объект на основе JSON
let mapData;

//-----------
let svg;
let instance;
//-----------

// переменная, которая хранит div блок с главным SVG
const svgContainer = document.getElementById('mapSvg');

// базовый URL страницы
const baseUrl = window.location.href.split('?')[0];

// переменная плавающего окошка с описанием кабинетов
const descriptionBlock  = document.getElementById('description');

// переменная с сылкой на поле поиска и переменная с ссылкой на поле с результатами поиска
const searchInput = document.getElementById('roomSearchInput');
const searchResultBlock = document.getElementById('searchResultBlock');
const searchParams = ['id', 'title', 'about'];
let categoriesAndRoomsList;

// переменная блока с текущим номером этажа
const currentFloorBlock = document.getElementById('currentFloor')

// переменные кнопок увеличения и уменьшения этажа
const floorIncreaseBtn = document.getElementById('floorIncrease');
const floorReduceBtn = document.getElementById('floorReduce');

// переменные для выбора категории
const choosenCategoryBlock = document.getElementById('categoriesChoosen_item');
const choosenCategoryTextBlock = document.getElementById('categoriesChoosen_item_text');
const closeChoosenCategoryButton = document.getElementById('categoriesChoosen_item_button');
let choosenCategory;

//текущий этаж, чтобы в дальнейшем его менять и делать проверку этажа
let currentFloor;

//----------------------------------------------------------------------------------------------------------------------

//парсим JSON; устанавливаем текущий этаж на тот, у которого  статус главного этажа
try {
   fetch('./map/bmstuJson.json')
   .then((response) => {
      if (response.status >= 200 && response.status < 300) {
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
      const urlParams = new URLSearchParams(window.location.search);
      const roomFromUrl = urlParams.get('location');
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

      //Формируем масси из комнат и категорий, можно вынести в отдельную функцию
      categoriesAndRoomsList = mapData.categories.map(categories => ({category: categories})).concat(
         mapData.floors.flatMap(floor => floor.locations.map(locations => ({
            floor: floor.id,
            room: locations
      }))));

      //--------
      instance = panzoom(svgContainer, {
         maxZoom: 2.5,
         minZoom: 1,
         zoomDoubleClickSpeed: 1, 
      });
      //--------

      formSearchResultList(searchParams);
   });
} catch(error) {
   console.log('Error: ' + e.message);
   console.log(e.response);
}

// Обработчик событий SVG файла для реагирования комнат на нажатие
svgContainer.addEventListener('click', (event) => {
   const roomElement = event.target.closest('[id^="room"]');
   if (roomElement) {
      selectRoom(roomElement);
   } else {
      const activeRoom = document.querySelector('[id^="room"].active');
      if (activeRoom) {
         removeSelectRoom(activeRoom);
      }
   }

});

// Обработчик событий для тех комнат, которые появились в списке поиска
searchResultBlock.addEventListener('click', (event) => searchResultsClickHandler(event));

// Обработчики событий для смены этажа
floorIncreaseBtn.addEventListener('click', () => { changeFloor(currentFloor + 1) });
floorReduceBtn.addEventListener('click', () => { changeFloor(currentFloor - 1) });

// обработчик событий для поиска комнат по описанию
searchInput.addEventListener('input', debounce(() => { formSearchResultList(searchParams) }, 700));

closeChoosenCategoryButton.addEventListener('click', () => {
   choosenCategory = "";
   disable(choosenCategoryBlock);
   formSearchResultList(searchParams);
})

//--------------------------------------------------------------------------------------------------------------------------------------------------------

// Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск). 
//Проверяем, что искомая комната есть, если есть, то проверка, что это она уже не включена,  
// заполняем блок описания данными из json, смещаем блок описания
function selectRoom(currentRoom) {
   const activeRoom = document.querySelector('[id^="room"].active');
   const roomId = currentRoom.getAttribute('id');
   let roomHasInfo = false;
   let currentFLoorRooms =  mapData.floors[currentFloor].locations;

   if (activeRoom && activeRoom !== currentRoom) {
      removeSelectRoom(activeRoom);
   }

   currentRoom.classList.add('active');
   updateUrl(currentRoom.id);
   enable(descriptionBlock);

   //--------------

   const roomRect1 = currentRoom.getBoundingClientRect();
   const roomRect2 = svgContainer.getBoundingClientRect(); 
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
         } else if (roomRect.right + descriptionBlock.offsetWidth / 2 > mapContainer.offsetWidth) {
            descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth - 20}px`;
            descriptionBlock.style.top = `${roomRect.bottom + window.scrollY - descriptionBlock.offsetHeight / 2}px`;
         } else {
            descriptionBlock.style.left = `${roomRect.left - descriptionBlock.offsetWidth / 2 + roomRect.width / 2}px`;
            descriptionBlock.style.top = `${roomRect.top + window.scrollY - descriptionBlock.offsetHeight - 20}px`;
         }
      }
   });

   if (!roomHasInfo) {
      disable(descriptionBlock);
   }
};

function removeSelectRoom(activeRoom) {
   activeRoom.classList.remove('active');
   disable(descriptionBlock);
   resetUrl();
   //-------
   //instance.moveTo(0, 0);
   //instance.zoomTo(0, 0, 0.4);
}

//Убейте меня, памагити
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
         SearchResultList = categoriesAndRoomsList.filter(item => {
            return item.category;
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
async function searchResultsClickHandler(event) {
   if (event.target.tagName === 'BUTTON') {
      if(event.target.dataset.categoryId) {
         choosenCategory = event.target.dataset.categoryId;
         searchInput.value = "";
         enable(choosenCategoryBlock);
         formSearchResultList(searchParams);

         choosenCategoryTextBlock.innerHTML =
               `<h5>${event.target.dataset.title}</h5>
               <p>${event.target.dataset.about}</p>`;
      } else {
         let elementsFloor;
      
         mapData.floors.forEach((floor, i) => {
            if (floor.id.includes(event.target.dataset.floor)) {
               elementsFloor = i;
            }
         });

         if (currentFloor !== elementsFloor) {
            await changeFloor(elementsFloor);
         }
         
         const roomElement = document.getElementById(event.target.dataset.room);
         selectRoom(roomElement);
      }
   }
}

// функция смены этажа, в ней происходиь проверка, загрузка нужной svg, отключение кнопок + и - ,а также выделение комнаты, если есть id в url
async function changeFloor(floor) {
   let floorsList = mapData.floors;
   
   if (floor < 0 || floor >= floorsList.length) {
      console.log('такого этажа нет');
   } else {
      try {
         let response = await
         fetch(floorsList[floor].map)
            .then((response) => {
               if (response.status >= 200 && response.status < 300) {
                  return response;
               } else {
                  let error = new Error(response.statusText);
                  error.response = response;
                  throw error
               }
            });

         let svg = await response.text();
         svgContainer.innerHTML = svg;
      } catch(error) {
         console.log('Error: ' + e.message);
         console.log(e.response);
      }
      
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

      const urlParams = new URLSearchParams(window.location.search);
      const roomFromUrl = urlParams.get('location');
      if (roomFromUrl) {
         const roomElement = document.getElementById(roomFromUrl);
         if (roomElement) {
            selectRoom(roomElement);
         }
      }
   }
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

function debounce(func, ms) {
   let timeout;
   return function() {
     clearTimeout(timeout);
     timeout = setTimeout(() => func.apply(this, arguments), ms);
   };
 }