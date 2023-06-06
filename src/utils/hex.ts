// Source From: https://stackoverflow.com/questions/21647928/javascript-unicode-string-to-hex

export function hexToString(hex: string): string {
    var hex = hex.toString();//force conversion
    var str = ''
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
    return str
}

export function stringToHex(str: string): string {
    var hex = ''
    for(var i=0;i<str.length;i++) {
        hex += ''+str.charCodeAt(i).toString(16)
    }
    return hex
}