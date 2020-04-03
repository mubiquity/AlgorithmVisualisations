// hex to rgb
function hexToRgb(hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i
        ,(m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16))
}

//colorChannelA and colorChannelB are ints ranging from 0 to 255
function colorChannelMixer(colorChannelA, colorChannelB, amountToMix){
    let channelA = colorChannelA*amountToMix;
    let channelB = colorChannelB*(1-amountToMix);
    return parseInt(channelA+channelB);
}
//rgbA and rgbB are arrays, amountToMix ranges from 0.0 to 1.0
//example (red): rgbA = [255,0,0]
function colorMixer(rgbA, rgbB, amountToMix){
    let r = colorChannelMixer(rgbA[0], rgbB[0], amountToMix);
    let g = colorChannelMixer(rgbA[1], rgbB[1], amountToMix);
    let b = colorChannelMixer(rgbA[2], rgbB[2], amountToMix);
    return "rgb("+r+","+g+","+b+")";
}