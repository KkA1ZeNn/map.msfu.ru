export default class InteractiveMap {
   constructor() {
      this.mapData;
      this.svg;
      this.instance;
      this.categoriesAndRoomsList;
      this.choosenCategory;
      this.currentFloor;

      this.mapContainer = document.createElement('div');
      this.svgContainer = document.createElement('div');

      this.currentFloor = document.createElement('div');
      this.floorReduce = document.createElement('button');
      this.floorIncrease = document.createElement('button');
   }

   render() {
      this.injectStyle();
      this.fetchingJSON();
      let interactiveBlock = document.createElement('div');
      let floorSwitchingBar = document.createElement('div');
      let searchingBlock = document.createElement('div');

      //this.roomSearchInput = document.createElement('input');
      //this.searchResultBlock = document.createElement('div');
      //this.categoriesBlock = document.createElement('div');

      //let descriptionBlock = document.createElement('div');

      //let categoriesChoosen = document.createElement('div'),
      //   categoriesChoosen_item = document.createElement('div'),
      //   categoriesChoosen_item_text = document.createElement('div'),
      //   categoriesChoosen_item_button = document.createElement('button');

      interactiveBlock.append(this.mapContainer);
      interactiveBlock.append(floorSwitchingBar);

      this.mapContainer.append(this.svgContainer);

      floorSwitchingBar.append(this.currentFloor);
      floorSwitchingBar.append(this.floorReduce);
      floorSwitchingBar.append(this.floorIncrease);

      interactiveBlock.classList.add('interactiveBlock');
      floorSwitchingBar.classList.add('floorSwitchingBar');
      searchingBlock.classList.add('searchingBlock');

      this.mapContainer.classList.add('mapContainer');
      this.svgContainer.classList.add('svgConteiner');

      this.currentFloor.classList.add('currentFloor');
      this.floorReduce.classList.add('floorReduce');
      this.floorIncrease.classList.add('floorIncrease');
      this.floorReduce.innerHTML = `-`;
      this.floorIncrease.innerHTML = `+`;

      document.querySelector("body").append(interactiveBlock);
      document.querySelector("body").append(searchingBlock);
   }

   fetchingJSON() {
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
         this.mapData = json;
         //Формируем масси из комнат и категорий, можно вынести в отдельную функцию
         this.categoriesAndRoomsList = this.mapData.categories.map(categories => ({category: categories})).concat(
            this.mapData.floors.flatMap(floor => floor.locations.map(locations => ({
               floor: floor.id,
               room: locations
         }))));

         const roomIdFromUrl = this.checkURL();
         if (roomIdFromUrl) {
            selectRoom(roomIdFromUrl);
         } else {
            this.mapData.floors.forEach((floor, i) => {
               if (floor.status === 'main floor') {
                  this.setFloor(i);
               }
            });
         }

         //--------
         this.instance = panzoom(this.svgContainer, {
            maxZoom: 2.5,
            minZoom: 1,
            zoomDoubleClickSpeed: 1,
            bounds: true,
            boundsPadding: 0.2,
            zoomSpeed: 0.07,
            onDoubleClick: function() {
               resetZoom();
            }
         });
         //--------
         console.log('двойной клик для сброса карты');
         formSearchResultList(searchParams);
      })
      .catch(e => {
         console.log('Error: ' + e.message);
      });
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
         //currentFloorBlock.textContent = floorsList[floor].title;
   
         //hide(descriptionBlock);
         //enable(floorReduceBtn);
         //enable(floorIncreaseBtn);
   
         //if (floor === 0) {
         //   disable(floorReduceBtn);
         //} else if (floor === floorsList.length - 1) {
         //   disable(floorIncreaseBtn);
         //}
      }
   }

   checkURL() {
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

   injectStyle() {
      const style = document.createElement('style');
      style.innerHTML = `
         /*стили для контейнера с самой картой*/
         .interactiveBlock {
            position: absolute;
            width: 1000px;
            height: 500px;
            border: 3px solid black;
            left: 25%;
         }

         .mapContainer {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            margin: auto;
         }

         .svgConteiner {
            width: 100%;
            height: 100%;
            max-height: 500px;
            display: flex;
            justify-content: center;
            transition: 0.1s;
            overflow: hidden;
            border: 2px solid red;
            box-sizing: border-box;
         }

         .searchingBlock {
            position: absolute;
            width: 450px;
            height: 500px;
            border: 3px solid black;
            left: 10px;
         }

         .floorSwitchingBar {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: space-around;
            width: 150px;
            height: 40px;
            background-color: yellow;
            bottom: 0px;
            right: 0px;
            z-index: 10;
         }

         /*стили для кнопок + и -, включенных и отключенных*/
         .floorIncrease, .floorReduce {
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            padding: 0;
         }

         .currentFloor {
            width: 80px;
            height: 30px;
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