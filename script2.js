
 // Ссылка на главный SVG
 const svgElement = document.getElementById('Слой_1');

// Обработчик событий SVG файла для реагирования комнат на нажатие
svgElement.addEventListener('click', (event) => {
   // Устанавливаем ссылку на ближайшего родителя нажатого элемента с id = room... (у нас room висит над тремя дочерними полигонами, поэтому родитель)
   const roomElement = event.target.closest('[id^="room"]');

   if (roomElement) {
     // Если кликнули по комнате, то проверяем, есть ли сейчас уже есть активная комната, также проверяем, что это не она же самаи в противном случае удаляем у нее active
     const activeElement = document.querySelector('[id^="room"].active');
     if (activeElement && activeElement !== roomElement) {
       activeElement.classList.remove('active');
     }

     // Добавляем active к новой комнате
     roomElement.classList.add('active');
   } else {
     // Если кликнули не по комнате, то находим комнату с классом active и удаляем его, тем самым, выключая выделение комнаты
     const activeElement = document.querySelector('[id^="room"].active');
     if (activeElement) {
       activeElement.classList.remove('active');
     }
   }
 });



