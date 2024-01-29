export default class InteractiveMap {
   constructor() {

   }

   render() {
      let mapContainer = document.createElement('div');
      this.roomSearchInput = document.createElement('input');
      this.currentFloor = document.createElement('div');
      this.floorReduce = document.createElement('button');
      this.floorIncrease = document.createElement('button');
      this.searchResultBlock = document.createElement('div');
      this.categoriesBlock = document.createElement('div');

      let svgContainer = document.createElement('div'),
         descriptionBlock = document.createElement('div');

      let categoriesChoosen = document.createElement('div'),
         categoriesChoosen_item = document.createElement('div'),
         categoriesChoosen_item_text = document.createElement('div'),
         categoriesChoosen_item_button = document.createElement('button');

         mapContainer.append(this.roomSearchInput);
   }
}