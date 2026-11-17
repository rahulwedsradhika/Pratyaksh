// Keep callback order deterministic, including within a database transaction.
export async function asyncMap(items, callback) {const result=[];for(let i=0;i<items.length;i++)result.push(await callback(items[i],i,items));return result;}
export async function asyncEach(items, callback) {for(let i=0;i<items.length;i++)await callback(items[i],i,items);}
export async function asyncFilter(items, callback) {const result=[];for(let i=0;i<items.length;i++)if(await callback(items[i],i,items))result.push(items[i]);return result;}
export async function asyncFind(items, callback) {for(let i=0;i<items.length;i++)if(await callback(items[i],i,items))return items[i];}
export async function asyncSome(items, callback) {return (await asyncFind(items,callback))!==undefined;}
export async function asyncEvery(items, callback) {for(let i=0;i<items.length;i++)if(!await callback(items[i],i,items))return false;return true;}
