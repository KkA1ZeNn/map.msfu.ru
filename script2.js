//переменная, которая хранит JSON
let http = new XMLHttpRequest();
let parsedJson;
// переменная, которая хранит главный SVG
const svgElement = document.getElementById('Слой_1');

//переменная плавающего окошка с описанием кабинета
const infoDiv = document.getElementById('discription');

//парсим JSON
http.open('get', './map/bmstuJson.json', true);
http.send();
http.onload = function () {
   if (this.readyState === 4 && this.status === 200) {
      parsedJson = JSON.parse(this.responseText);
   }
};

// Обработчик событий SVG файла для реагирования комнат на нажатие
svgElement.addEventListener('click', (event) => {

   // Устанавливаем ссылку на ближайшего родителя нажатого элемента с id = room... (у нас room висит на элементе с тремя дочерними полигонами, поэтому родитель)
   const roomElement = event.target.closest('[id^="room"]');

   if (roomElement) {
      //roomId-хранит айди комнаты для дальнейшего поиска в json;  allRooms-массив из всех комнат первого этажа, json; roomHasInfo хранит в себе статус того, нашлась информация о комнате или нет, если нет, то мы закрываем окно
      const roomId = roomElement.getAttribute('id');
      const allRooms = parsedJson.levels[0].locations;
      let roomHasInfo = false;

      // Если кликнули по комнате, то проверяем, есть ли сейчас уже есть активная комната, также проверяем, что это не она же сама и в противном случае удаляем у нее active
      const activeElement = document.querySelector('[id^="room"].active');
      if (activeElement && activeElement !== roomElement) {
         activeElement.classList.remove('active');
      }

      // Делаем комнату активной и включаем окно с описанием
      roomElement.classList.add('active');
      infoDiv.style.display = "flex";

      //пробегаемся циклом по массиву с комнатами, когда находим нужную нам, берем из нее информацию для описания и вставляем его в div элемент
      for (let i = 0; i < allRooms.length; ++i) {
         if (allRooms[i].id === roomId) {
            roomHasInfo = true;
            infoDiv.innerHTML =
               `<h4>${allRooms[i].title}</h4>
               <p>${allRooms[i].about}</p>`;

            //функция для считывания размера элемента и перемещения окна, но пока работает КРИВО
            const roomRect = roomElement.getBoundingClientRect();
            infoDiv.style.position = 'absolute';
            infoDiv.style.top = `${roomRect.top - 20}px`;
            infoDiv.style.left = `${roomRect.left - 120}px`;
         }
      }

      if (!roomHasInfo) {
         infoDiv.style.display = "none";
      }
      

   } else {
      // Если кликнули не по комнате, то находим комнату с классом active и удаляем его, тем самым, выключая выделение комнаты, также скрываем всплывающее окно с описанием и ставим дефолтное описание, потому что есть баг, когда после комнаты с описанием, тыкаешь на ту, где его нет, она показывает описание из предыдущей комнаты
      const activeElement = document.querySelector('[id^="room"].active');
      if (activeElement) {
         activeElement.classList.remove('active');
         infoDiv.style.display = "none";
      }
   }
});







