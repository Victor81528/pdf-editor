export const base64ToBlob = (base64) => {

    const binaryImg = atob(base64.split(',')[1])
    
    const byteNumbers = new Array(binaryImg.length);
    for (let i = 0; i < binaryImg.length; i++) {
        byteNumbers[i] = binaryImg.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/png' })

    return blob
}