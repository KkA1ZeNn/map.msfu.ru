export default class InteractiveMap {
   constructor() {
      this.mapData;
      this.svg;
      this.instance;
      this.categoriesAndRoomsList;
      this.choosenCategory;
      this.currentFloor;
      this.searchParams = ['id', 'title', 'about'];
      this.baseUrl = window.location.href.split('?')[0];
      this.zoomLimit = 0;

      this.interactiveBlock = document.createElement('div');
         this.mapContainer = document.createElement('div');
            this.svgContainer = document.createElement('div');
            this.descriptionBlock = document.createElement('div');
         this.mobileDescriptionBlock = document.createElement('div');
         this.interactiveBlockController = document.createElement('div');
            this.switchFloorBar = document.createElement('div');
               this.currNameArrowsWrapper = document.createElement('div');
                  this.currentFloorName = document.createElement('button');
                     this.floorNamesBlock = document.createElement('div');
                  this.floorSwitchArrowsBlock = document.createElement('div');
                     this.floorReduceBtn = document.createElement('button');
                     this.floorIncreaseBtn = document.createElement('button');
            this.changeZoomBar = document.createElement('div');
               this.zoomIncreaseBtn = document.createElement('button');
               this.zoomReduceBtn = document.createElement('button');

      this.searchingBlock = document.createElement('div');
         this.searchInput = document.createElement('input');
         this.categoriesBlock = document.createElement('div');
            this.choosenCategoryBlock = document.createElement('div'),
            this.choosenCategoryTextBlock = document.createElement('div'),
            this.closeChoosenCategoryButton = document.createElement('button');
         this.searchResultBlock = document.createElement('div');


      // Обработчик событий SVG файла для реагирования комнат на нажатие
      this.svgContainer.addEventListener('click', (event) => {
         const roomElement = event.target.closest('[id^="room"]');
         if (roomElement) {
            this.selectRoom(roomElement.getAttribute('id'));
         } else {
            this.resetUrl();

            const activeRoom = document.querySelector('[id^="room"].active');
            if (activeRoom) {
               this.removeSelectRoom(activeRoom);
            }
         }
      });

      // Обработчик событий для тех комнат, которые появились в списке поиска
      this.searchResultBlock.addEventListener('click', (event) => this.searchResultsClickHandler(event));

      // Обработчики событий для смены этажа
      this.floorIncreaseBtn.addEventListener('click', async () => { 
         await this.setFloor(this.currentFloor + 1);
         const roomFromUrl = document.querySelector( '#' + this.checkURL() );
         if (roomFromUrl) {
            this.selectRoom(roomFromUrl.getAttribute('id'));
         }
      });
      this.floorReduceBtn.addEventListener('click', async () => { 
         await this.setFloor(this.currentFloor - 1);
         const roomFromUrl = document.querySelector( '#' + this.checkURL() );
         if (roomFromUrl) {
            this.selectRoom(roomFromUrl.getAttribute('id'));
         }
      });

      // обработчик событий для поиска комнат по описанию
      this.searchInput.addEventListener('input', this.debounce(() => { this.formSearchResultList(this.searchParams) }, 700));

      this.closeChoosenCategoryButton.addEventListener('click', () => {
         this.choosenCategory = "";
         this.hide(this.choosenCategoryBlock);
         this.formSearchResultList(this.searchParams);
      });

      this.currentFloorName.addEventListener('click', () => {
         const activeRoom = document.querySelector('[id^="room"].active');
         if (activeRoom) {
            this.removeSelectRoom(activeRoom);
         }
         this.floorNamesBlock.classList.toggle('hidden');
         this.switchFloorBar.addEventListener('mouseenter', () => {
            this.instance.pause();
         });
         this.switchFloorBar.addEventListener('mouseleave', () => {
            this.instance.resume();
         });
      });

      this.floorNamesBlock.addEventListener(('click'), (event) => {
         this.mapData.floors.forEach((floor, i) => {
            if (floor.id === event.target.dataset.id) {
               this.setFloor(i);
            }
         });
      });

      this.zoomIncreaseBtn.addEventListener('click', async () => { 
         const containerRect = this.interactiveBlock.getBoundingClientRect();
         this.instance.getTransform().scale = Math.round(this.instance.getTransform().scale);
         this.enable(this.zoomReduceBtn);
         ++this.zoomLimit;
         this.instance.smoothZoom(containerRect.width / 2, containerRect.height / 2, 2);
         if (this.zoomLimit === 2) {
            this.disable(this.zoomIncreaseBtn);
         }         
      });
      this.zoomReduceBtn.addEventListener('click', async () => { 
         const containerRect = this.interactiveBlock.getBoundingClientRect();
         this.instance.getTransform().scale = Math.round(this.instance.getTransform().scale);
         this.enable(this.zoomIncreaseBtn);
         --this.zoomLimit;
         this.instance.smoothZoom(containerRect.width / 2, containerRect.height / 2, 1 / 2);
         if (this.zoomLimit === 0) {
            this.disable(this.zoomReduceBtn);
         }  
      });
   }

   render() {
      this.injectStyle();
      this.fetchingJSON();

      this.interactiveBlock.append(this.mapContainer);
      this.mapContainer.append(this.svgContainer, this.descriptionBlock);
      this.interactiveBlockController.append(this.switchFloorBar, this.changeZoomBar);
      this.switchFloorBar.append(this.currNameArrowsWrapper);
      this.currNameArrowsWrapper.append(this.currentFloorName, this.floorSwitchArrowsBlock);
      this.floorSwitchArrowsBlock.append(this.floorIncreaseBtn, this.floorReduceBtn);
      this.switchFloorBar.append(this.floorNamesBlock);
      this.changeZoomBar.append(this.zoomIncreaseBtn, this.zoomReduceBtn);


      this.searchingBlock.append(this.searchInput, this.categoriesBlock, this.searchResultBlock);
      this.categoriesBlock.append(this.choosenCategoryBlock);
      this.choosenCategoryBlock.append(this.choosenCategoryTextBlock, this.closeChoosenCategoryButton);

      this.interactiveBlock.classList.add('interactiveBlock');
      this.mapContainer.classList.add('mapContainer');
      this.svgContainer.classList.add('svgConteiner');
      this.descriptionBlock.classList.add('descriptionBlock', 'hidden');
      this.mobileDescriptionBlock.classList.add('mobileDescriptionBlock', 'hidden');
      this.interactiveBlockController.classList.add('interactiveBlockController');
      this.currNameArrowsWrapper.classList.add("currNameArrowsWrapper");
      this.currentFloorName.classList.add("currentFloorName");
      this.floorNamesBlock.classList.add("floorNamesBlock", "hidden");
      this.switchFloorBar.classList.add('switchFloorBar');
      this.floorSwitchArrowsBlock.classList.add('floorSwitchArrowsBlock');
      this.changeZoomBar.classList.add('changeZoomBar');
      this.floorReduceBtn.classList.add('floorReduceBtn');
      this.floorIncreaseBtn.classList.add('floorIncreaseBtn');
      this.zoomIncreaseBtn.classList.add('zoomIncreaseBtn');
      this.zoomReduceBtn.classList.add('zoomReduceBtn');

      this.searchingBlock.classList.add('searchingBlock', 'hidden');
      this.searchInput.classList.add('searchInput');
      this.categoriesBlock.classList.add('categoriesBlock');
      this.choosenCategoryBlock.classList.add('choosenCategoryBlock','hidden');
      this.choosenCategoryTextBlock.classList.add('choosenCategoryTextBlock');
      this.closeChoosenCategoryButton.classList.add('closeChoosenCategoryButton');
      this.searchResultBlock.classList.add('searchResultBlock');

      this.closeChoosenCategoryButton.innerHTML = `X`;
      this.searchInput.setAttribute('type', 'text');
      this.searchInput.setAttribute('placeholder', 'Enter class number or name of the department');

      this.searchButton = document.querySelector("#nav__search__button");
      document.querySelector(".main").append(this.interactiveBlock, this.interactiveBlockController, this.searchingBlock, this.mobileDescriptionBlock);
   
      this.searchButton.addEventListener('click', () => {
         this.searchingBlock.classList.toggle('hidden');
      })
   }

   fetchingJSON() {
      fetch('../data/bmstuJson.json')
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
         this.mapData = json;
         //Формируем масси из комнат и категорий, можно вынести в отдельную функцию
         this.categoriesAndRoomsList = this.mapData.categories.map(categories => ({category: categories})).concat(
            this.mapData.floors.flatMap(floor => floor.locations.map(locations => ({
               floor: floor.id,
               room: locations
         }))));

         this.createFloorsController();

         const roomIdFromUrl = this.checkURL();
         if (roomIdFromUrl) {
            this.selectRoom(roomIdFromUrl);
         } else {
            this.mapData.floors.forEach((floor, i) => {
               if (floor.status === 'main floor') {
                  this.setFloor(i);
               }
            });
         }

         //-------- был svgContainer, но возможно тут и кроется проблема, потому что в мапплике блок с описанием и сама карта в одном блоке находятся
         this.instance = panzoom(this.mapContainer, {
            maxZoom: 4,
            minZoom: 1,
            zoomDoubleClickSpeed: 1,
            bounds: true,
            boundsPadding: 0.2,
            zoomSpeed: 0.07
         });

         //--------
         console.log('двойной клик для сброса карты');
         this.formSearchResultList(this.searchParams);
         this.disable(this.zoomReduceBtn);
      })
      .catch(e => {
         console.log('Error: ' + e.message);
      });
   }

   createFloorsController() {
      this.mapData.floors.forEach((floor) => {
         let floorName = document.createElement('div');
         floorName.classList.add("floorName");
         floorName.innerHTML = `${floor.title}`;
         floorName.dataset.id = `${floor.id}`;
         this.floorNamesBlock.append(floorName);
      })
   }

   // Функция, которая отвечает за реакцию комнаты на выбор этой комнаты (нажатие или поиск). 
   //Проверяем, что искомая комната есть, если есть, то проверка, что это она уже не включена,  
   // заполняем блок описания данными из json, смещаем блок описания
   async selectRoom(roomID, flagOfUrl) {
      let roomElement = document.querySelector('#' + roomID);
      if (!roomElement) {
         for (const floor of this.mapData.floors) {
            for (const location of floor.locations) {
               if (location.id.includes(roomID)) {
                  await this.setFloor(this.mapData.floors.indexOf(floor));
               }
            }
         }
         roomElement = document.querySelector('#' + roomID);
      };

      const activeRoom = document.querySelector('[id^="room"].active');   
      const currentFLoorRooms =  this.mapData.floors[this.currentFloor].locations;

      if (activeRoom && activeRoom !== roomElement) {
         this.removeSelectRoom(activeRoom);
      }

      roomElement.classList.add('active');

      if (!flagOfUrl) {
         this.updateUrl(roomID);
      }

      currentFLoorRooms.forEach(room => {
         if (room.id === roomID) {
            this.showDescriptionBlock(roomElement, room.title, room.about);
         }
      });

      this.zoomRoom(roomElement);
   };

   showDescriptionBlock(currentRoom, title, about) {
      if (window.innerWidth < 1024) {
         this.show(this.mobileDescriptionBlock);
         this.interactiveBlock.style.marginBottom = 'auto';
         this.interactiveBlock.style.height = '61%';
         this.floorNamesBlock.classList.add('hidden');
      } else {
         this.show(this.descriptionBlock);
      }      
   
      this.descriptionBlock.innerHTML =
         `<h4>${title}</h4>
         <p>${about}</p>`;

      this.mobileDescriptionBlock.innerHTML =
         `<h4>${title}</h4>
         <p>${about}</p>`;
   
      // функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
      const roomRect = currentRoom.getBoundingClientRect();
      const blockRect = this.mapContainer.getBoundingClientRect();

      this.instance.on('zoom', () => {
         const xDistance= (roomRect.left + (roomRect.right - roomRect.left) / 2 - blockRect.left) / (blockRect.right - blockRect.left);
         const yDistance = (roomRect.top + (roomRect.bottom - roomRect.top) / 2 - blockRect.top) / (blockRect.bottom - blockRect.top) + scrollY;
   
         this.descriptionBlock.style.top = `${yDistance * 100}%`;
         this.descriptionBlock.style.left = `${xDistance * 100}%`;

         const scalingFactor = 1 / this.instance.getTransform().scale;
         this.descriptionBlock.style.transformOrigin = "bottom center";
         this.descriptionBlock.style.transform = `
            translate(-50%, ${-120 + scalingFactor}%)
            scale(${scalingFactor})
         `;
      })
   }

   //Функция зумирования на комнату, вычисляет смещение свг, так чтобы комната оказалась в центре контейнера, учитывая уже сделанное смещение, плюс производит увеличение в центр этого контейнера
   zoomRoom(currentRoom) {
      const roomRect = currentRoom.getBoundingClientRect();
      const containerRect = this.interactiveBlock.getBoundingClientRect();

      const containerCenterX = containerRect.left + (containerRect.right - containerRect.left) / 2;
      const containerCenterY = containerRect.top + (containerRect.bottom - containerRect.top) / 2 + window.scrollY;
      const roomCenterX = roomRect.left + (roomRect.right - roomRect.left) / 2;
      const roomCenterY = roomRect.top + (roomRect.bottom - roomRect.top) / 2 + window.scrollY;
      const currentTransform = this.instance.getTransform();

   
      const moveToX = containerCenterX - roomCenterX;
      const moveToY = containerCenterY - roomCenterY;
      this.instance.moveTo(currentTransform.x + moveToX, currentTransform.y + moveToY);
      this.instance.smoothZoom(containerRect.width / 2, containerRect.height / 2, 2.5);
   }

   removeSelectRoom(activeRoom) {
      activeRoom.classList.remove('active');
      this.hide(this.descriptionBlock);
      this.hide(this.mobileDescriptionBlock);
      this.interactiveBlock.style.marginBottom = '0';
      this.interactiveBlock.style.height = '80%';
      this.resetZoom();
   }
   
   
   //АЛААААААРМ, короче если тут вот считать начальное смещение карты console.log(this.mapContainer.getAttribute("style")); и передать сюда, то можно так пофиксить
   resetZoom() {
      this.instance.zoomTo(0, 0, 0.4);
      this.instance.moveTo(0, 0);
   }

   async setFloor(floor) {
      let floorsList = this.mapData.floors;
      
      if (floor < 0 || floor >= floorsList.length) {
         console.log('такого этажа нет');
      } else {
         try {
            let response = await fetch(floorsList[floor].map);
            this.currentFloorName.innerHTML = `${floorsList[floor].title}`;
   
            if (!response.ok) {
               let error = new Error(response.statusText);
               error.response = response;
               throw error;
            }
   
            let svg = await response.text();
            this.svgContainer.innerHTML = svg;
   
         } catch(e) {
            console.log('Error: ' + e.message);
         }
         
         this.currentFloor = floor;

         this.hide(this.floorNamesBlock);
   
         this.hide(this.descriptionBlock);
         this.hide(this.mobileDescriptionBlock);
         this.enable(this.floorReduceBtn);
         this.enable(this.floorIncreaseBtn);
   
         if (floor === 0) {
            this.disable(this.floorReduceBtn);
         } else if (floor === floorsList.length - 1) {
            this.disable(this.floorIncreaseBtn);
         }
      }
   }

   formSearchResultList(parameters) {
      const textInput = this.searchInput.value.toLowerCase();
      let SearchResultList;
   
      if (this.choosenCategory) {
         if (textInput === "") {
            SearchResultList = this.categoriesAndRoomsList.filter(item => {
               if (item.room && item.room.category) {
                  return item.room.category === this.choosenCategory;
               }
            });
         } else {
            SearchResultList = this.categoriesAndRoomsList.filter(item => {
               if (item.room && item.room.category && item.room.category === this.choosenCategory) {
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
            SearchResultList = this.mapData.categories.map(item => {
               return {category: item};
            });
         }
         else {
            SearchResultList = this.categoriesAndRoomsList.filter(item => {
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
   
      this.showSearchResult(SearchResultList);
   }

   showSearchResult(searchResult) {
      this.searchResultBlock.innerHTML = '';
   
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
   
         this.searchResultBlock.appendChild(variant);
      });
   }

   // функция поиска комнаты после клика по кнопке комнаты в списке. Если комната на текущем этаже, то сразу ищем, если нет, то надо отрисовать нужный этаж и найти там
   searchResultsClickHandler(event) {
      if (event.target.tagName === 'BUTTON') {
         if(event.target.dataset.categoryId) {
            this.choosenCategory = event.target.dataset.categoryId;
            this.searchInput.value = "";
            this.show(this.choosenCategoryBlock);
            this.formSearchResultList(this.searchParams);

            this.choosenCategoryTextBlock.innerHTML =
                  `<h5>${event.target.dataset.title}</h5>
                  <p>${event.target.dataset.about}</p>`;
         } else {
            this.selectRoom(event.target.dataset.room);
         }
      }
   }

   checkURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const roomIdFromUrl = urlParams.get('location');
      let result;
      if (roomIdFromUrl) {
         this.categoriesAndRoomsList.forEach(element => {
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

   // Функции для обновления и сброса URL при поиске комнат
   updateUrl(roomId) {
      const newUrl = this.baseUrl + '?location=' + roomId;
      history.replaceState( { roomId } , '', newUrl);
   }
   resetUrl() {
      history.replaceState( { roomId: null } , '', this.baseUrl);
   }

   // функции скрытия и показывания элемента
   disable(element) {
      element.disabled = true;
   }
   enable(element) {
      element.disabled = false;
   }

   hide(element) {
      element.classList.add('hidden');
   }
   show(element) {
      element.classList.remove('hidden');
   }

   //Функция для создания задержки вызова другой функции
   debounce(func, ms) {
      let timeout;

      return function() {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, arguments), ms);
      };
   }

   injectStyle() {
      const style = document.createElement('style');
      style.innerHTML = `
         /*стили для контейнера с самой картой*/
         .interactiveBlock {
            width: 100%;
            z-index: 980;
            height: 80%;
         }

         .mapContainer {
            width: 100%;
            height: auto;
            padding: 0px 10px;
            box-sizing: border-box;
         }

         .svgConteiner {
            width: 100%;
            height: auto;
         }

         /*стили для блока с информацией*/
         .descriptionBlock {
            background-color: #fff;
            box-shadow: 0 0 20px rgba(0,0,0,0.15);
            pointer-events: auto;
            padding: 16px;
            width: 300px;
            height: 100px;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: flex-start;
            position: absolute;
         }
         .descriptionBlock.hidden{
            display: none !important;
         }
         .descriptionBlock h4 {
            font-family: Roboto, Tahoma, Helvetica, sans-serif;
            font-size: 16px;
            margin: 0;
            color: #333;
            font-weight: bold;
            margin-bottom: 15px;
         }
         .descriptionBlock p {
            font-family: Roboto, Tahoma, Helvetica, sans-serif;
            font-size: 13px;
            margin: 0;
            color: #333;
         }

         .searchingBlock {
            position: absolute;
            width: 100%;
            height: 100%;
            border: 3px solid black;
            z-index: 999;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: start;
         }

         .searchingBlock.hidden {
            display: none;
         }

         .searchInput {
            padding: 0;
            box-sizing: border-box;
            width: 100%;
            height: 30px;
         }

         /*стили для блока с категориями и элементов списка*/
         .categoriesBlock {
            height: auto;
            width: 100%;
            min-height: 50px;
            background-color: orange;
            display: flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
         }

         .choosenCategoryBlock{
            height: 40px;
            width: 250px;
            background-color: #fff;
            border-radius: 20px;
            border: 2px solid black;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: space-between;
         }
         
         .choosenCategoryBlock.hidden {
            display: none;
         }
         
         .choosenCategoryTextBlock {
            width: auto;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
         }
         .choosenCategoryTextBlock p {
            margin: 0;
            width: auto;
            font-size: 11px;
         }
         .choosenCategoryTextBlock h5 {
            margin: 0 10px 0 10px;
         }
         
         .closeChoosenCategoryButton {
            width: 20px;
            height: 20px;
            margin: 0px 5px;
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
         }

         /*стили блока с подсказками для поиска*/
         .searchResultBlock {
            width: 100%;
            height: 420px;
            background-color: yellow;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            justify-content: start;
            overflow-y: auto;
         }

         .searchResultBlock_item {
            width: 100%;
            min-height: 50px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 10px;
            box-sizing: border-box;
            color: black;
            border: 3px solid green;
            background-color: lightblue;
            cursor: pointer;
         }

         .interactiveBlockController {
            position: absolute;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: space-between;
            width: 157px;
            height: 100%;
            padding: 10px 0px 16px 0px;
            margin-right: 10px;
            box-sizing: border-box;
            top: 0px;
            right: 0px;
            z-index: 998;
            pointer-events: none;
         }

         .switchFloorBar {
            width: 100%;
            min-height: 54px;
            max-height: 324px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            border-radius: 10px;
            box-shadow: 0px 2px 6px 0px rgba(176, 176, 176, 0.2);
            pointer-events: auto;
         }

         /* Скрываем scrollbar для Chrome, Safari и Opera */
         .switchFloorBar::-webkit-scrollbar {
            display: none;
         }
         
         /* Скрываем scrollbar для IE, Edge и Firefox */
         .switchFloorBar {
            -ms-overflow-style: none;  /* IE и Edge */
            scrollbar-width: none;  /* Firefox */
         }

         .currNameArrowsWrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 54px;
            background-color: #fff;
            pointer-events: auto;
            cursor: pointer;
            position: relative;
         }

         .currentFloorName {
            padding: 0;
            width: 127px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align:center;
            border: none;
            border-radius: 10px;
            font: normal 16px/1 'ALS Sector Regular';
            background-color: #ffffff;
            cursor: pointer;
         }

         .floorSwitchArrowsBlock {
            height: 54px;
            width: calc(100% - 127px);
            display: flex;
            flex-direction: column;
         }

         .floorIncreaseBtn, .floorReduceBtn {
            cursor: pointer;
            width: 100%;
            height: 100%;
            border: none;
            background-color: #fff;
            padding: 0;
            position: relative;
         }

         .floorIncreaseBtn::after, .floorReduceBtn::after {
            content: ''; 
            position: absolute; 
            top: 50%;
            left: 50%; 
            border: 5px solid transparent; 
         }

         .floorIncreaseBtn::after {
            transform: translate(-50%, -70%);
            border-bottom: 6px solid #429C97;
         }
         .floorReduceBtn::after {
            transform: translate(-50%, -30%);
            border-top: 6px solid #429C97;
         }

         .floorIncreaseBtn:disabled::after {
            border-bottom: 6px solid #7C8786;
         }
         .floorReduceBtn:disabled::after {
            border-top: 6px solid #7C8786;
         }

         .floorNamesBlock {
            width: 100%;
            height: auto;
            cursor: pointer;
         }

         .floorNamesBlock.hidden {
            display: none;
         }
         
         .floorName {
            width: 100%;
            height: 54px;
            background-color: #fff;
            display: flex;
            align-items: center;
            justify-content: flex-start;
            padding-left: 14px;
            font: normal 16px/1 'ALS Sector Regular';
            box-sizing: border-box;
         }

         .floorName:hover {
            background-color: #F2F3F4;
         }

         .changeZoomBar {
            width: auto;
            min-width: 40px;
            height: auto;
            min-height: 88px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            pointer-events: auto;
            cursor: pointer;
         }

         .zoomIncreaseBtn {
            margin-bottom: 8px;
         }

         .zoomIncreaseBtn, .zoomReduceBtn {
            width: 40px;
            height: 40px;
            border: none;
            background-color: #fff;
            border-radius: 10px;
            padding: 0;
            box-shadow: 0px 2px 6px 0px rgba(176, 176, 176, 0.2);
            position: relative;
            cursor: pointer;
         }

         .zoomIncreaseBtn::after, .zoomIncreaseBtn::before, .zoomReduceBtn::after {
            content: "";
            display: block;
            background-color: #429C97;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            border-radius: 1px;
         }

         .zoomIncreaseBtn::after, .zoomReduceBtn::after {
            width: 17.67px;
            height: 2.17px;
         } 
         .zoomIncreaseBtn::before {
            width: 2.17px;
            height: 17.67px;
         }

         .zoomIncreaseBtn:disabled::after, .zoomReduceBtn:disabled::after, .zoomIncreaseBtn:disabled::before {
            background-color: #7C8786;
         }

         .zoomIncreaseBtn:disabled, .zoomReduceBtn:disabled {
            background-color: #F2F3F4;
         }

         .mobileDescriptionBlock {
            width: 100%;
            height: 39.2%;
            position: absolute;
            bottom: 0;
            z-index: 1100;
            background-color: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            border-radius: 10px 10px 0 0;
            padding: 15px 20px 20px 20px;
            box-sizing: border-box;
         }

         .mobileDescriptionBlock.hidden{
            display: none !important;
         }

         .mobileDescriptionBlock h4 {
            width: 100%;
            font: bold 16px/1 'ALS Sector Bold';
            margin: 0 0 10px 0;
         }

         .mobileDescriptionBlock p {
            font: normal 14px/1 'ALS Sector Regular';
            width: 100%;
            margin: 0;
         }

         /*стили для комнат при наведении*/
         [id^="room-"]:hover polygon {
            filter: brightness(1.15);
            cursor: pointer;
         }

         /*отключаем курсор на тексте комнат*/
         [id^="Текст"] * {
            pointer-events: none;
         }

         /*стили для нажатых комнат*/
         .active polygon{
            filter: brightness(0.8) hue-rotate(90deg) !important;
         }
      `;
      document.querySelector('head').appendChild(style);
   }
}