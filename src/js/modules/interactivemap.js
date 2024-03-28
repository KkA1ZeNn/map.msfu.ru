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

      this.interactiveBlock = document.createElement('div');
         this.mapContainer = document.createElement('div');
            this.svgContainer = document.createElement('div');
            this.descriptionBlock = document.createElement('div');
         this.interactiveBlockController = document.createElement('div');
            this.switchFloorBar = document.createElement('div');
               this.floorName = document.createElement('select');
            this.changeZoomBar = document.createElement('div');
               this.currentFloorNumber = document.createElement('div');
               this.floorReduceBtn = document.createElement('button');
               this.floorIncreaseBtn = document.createElement('button');

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
         if(roomFromUrl) {
            this.selectRoom(roomFromUrl.getAttribute('id'));
         }
      });
      this.floorReduceBtn.addEventListener('click', async () => { 
         await this.setFloor(this.currentFloor - 1);
         const roomFromUrl = document.querySelector( '#' + this.checkURL() );
         if(roomFromUrl) {
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

   }

   render() {
      this.injectStyle();
      this.fetchingJSON();

      this.interactiveBlock.append(this.mapContainer, this.interactiveBlockController);
      this.mapContainer.append(this.svgContainer, this.descriptionBlock);
      this.interactiveBlockController.append(this.switchFloorBar, this.changeZoomBar);
      this.switchFloorBar.append(this.floorName);

      this.searchingBlock.append(this.searchInput, this.categoriesBlock, this.searchResultBlock);
      this.categoriesBlock.append(this.choosenCategoryBlock);
      this.choosenCategoryBlock.append(this.choosenCategoryTextBlock, this.closeChoosenCategoryButton);

      this.interactiveBlock.classList.add('interactiveBlock');
      this.mapContainer.classList.add('mapContainer');
      this.svgContainer.classList.add('svgConteiner');
      this.descriptionBlock.classList.add('descriptionBlock');
      this.interactiveBlockController.classList.add('interactiveBlockController');
      this.floorName.classList.add("floorName");
      this.switchFloorBar.classList.add('switchFloorBar');
      this.changeZoomBar.classList.add('changeZoomBar');
      this.currentFloorNumber.classList.add('currentFloorNumber');
      this.floorReduceBtn.classList.add('floorReduceBtn');
      this.floorIncreaseBtn.classList.add('floorIncreaseBtn');

      this.searchingBlock.classList.add('searchingBlock');
      this.searchInput.classList.add('searchInput');
      this.categoriesBlock.classList.add('categoriesBlock');
      this.choosenCategoryBlock.classList.add('choosenCategoryBlock','hidden');
      this.choosenCategoryTextBlock.classList.add('choosenCategoryTextBlock');
      this.closeChoosenCategoryButton.classList.add('closeChoosenCategoryButton');
      this.searchResultBlock.classList.add('searchResultBlock');

      this.floorReduceBtn.innerHTML = `-`;
      this.floorIncreaseBtn.innerHTML = `+`;
      this.closeChoosenCategoryButton.innerHTML = `X`;
      this.searchInput.setAttribute('type', 'text');
      this.searchInput.setAttribute('placeholder', 'Enter class number or name of the department');

      document.querySelector(".main").append(this.interactiveBlock, this.searchingBlock);
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

         this.mapData.floors.forEach((floor, i) => {
            let newOption = new Option(floor.title, floor.id);
            this.floorName.prepend(newOption);
            if (floor.status === 'main floor') {
               newOption.selected = true;
            }
         });

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
            maxZoom: 2.5,
            minZoom: 1,
            zoomDoubleClickSpeed: 1,
            bounds: true,
            boundsPadding: 0.2,
            zoomSpeed: 0.07,
            onDoubleClick: () => {
               this.resetZoom();
            }
         });

         //--------
         console.log('двойной клик для сброса карты');
         this.formSearchResultList(this.searchParams);
      })
      .catch(e => {
         console.log('Error: ' + e.message);
      });
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
      this.show(this.descriptionBlock);
   
      this.descriptionBlock.innerHTML =
         `<h4>${title}</h4>
         <p>${about}</p>`;
   
      // функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
      const roomRect = currentRoom.getBoundingClientRect();
      const blockRect = this.mapContainer.getBoundingClientRect();
      const descriptionRect = this.descriptionBlock.getBoundingClientRect();
      const currentTransform = this.instance.getTransform();

      console.log(this.instance.getTransform());
      this.instance.on('zoom', () => {
         console.log(1 / this.instance.getTransform().scale);
         const xDistance= (roomRect.left + (roomRect.right - roomRect.left) / 2 - blockRect.left) / (blockRect.right - blockRect.left);
         const yDistance = (roomRect.top + (roomRect.bottom - roomRect.top) / 2 - blockRect.top) / (blockRect.bottom - blockRect.top) + scrollY;
   
         this.descriptionBlock.style.top = `${yDistance * 100}%`;
         this.descriptionBlock.style.left = `${xDistance * 100}%`;
         //this.descriptionBlock.style.transform = "translate(-50%,-125%)";


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
   }
   
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
         this.currentFloorNumber.textContent = floorsList[floor].title;
   
         this.hide(this.descriptionBlock);
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
            height: 100%;
            position: relative;
         }

         .mapContainer {
            width: 100%;
            height: auto;
            padding: 0px 10px;
            box-sizing: border-box;
         }

         .svgConteiner {
            width: 100%;
            height: 100%;
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
            width: 450px;
            height: 500px;
            border: 3px solid black;
            left: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: start;
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
            padding: 10px 10px 16px 0px;
            box-sizing: border-box;
            top: 0px;
            right: 0px;
            z-index: 100;
         }

         .switchFloorBar {
            width: 100%;
            height: 54px;
            background-color: #fff;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: space-between;
         }

         .floorName {
            width: 127px;
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align:center;
            border: none;
            border-radius: 10px;
            font: normal 16px/1 'ALS Sector Regular';

            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
         }

         .floorName:focus {
            border: none;
            outline:none
         }
          
          Interner Explorer не признает свойство appearance, поэтому для него есть особый способ, как убрать стрелку из select.
          
          .floorName::-ms-expand {
            display: none;
          }

         .changeZoomBar {
            width: 40px;
            min-width: 40px;
            height: 88px;
            min-height: 88px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
         }

         /*стили для кнопок + и -, включенных и отключенных*/
         .floorIncreaseBtn, .floorReduceBtn {
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            padding: 0;
         }

         .currentFloorNumber {
            width: 80px;
            height: 30px;
            font-size: 12px;
            background-color: white;
            border: 1px solid black;
            display: flex;
            align-items: center;
            justify-content: center;
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