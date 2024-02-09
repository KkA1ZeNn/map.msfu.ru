import { deleteAsync } from "del";

// Delete the dir
const clear = () => {
   return deleteAsync($.path.root);
}

export { clear };