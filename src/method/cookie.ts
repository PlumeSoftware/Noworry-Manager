export function getCookie(cookieName:string) {
    const strCookie = document.cookie;
    const arrCookie = strCookie.split("; ");
    for(let i = 0; i < arrCookie.length; i++){
        const arr = arrCookie[i].split("=");
        if(cookieName == arr[0]){
            return arr[1];
        }
    }
    return "";
}