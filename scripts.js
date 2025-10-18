let intervalvalue = [];
const errorMessage = "Please enter a valid Input in number which has to be greater than 0 or 0 and you have entered: ";
const boxContainer = document.getElementById('container-box-elem');
const submitElem = document.getElementById("btn");
const startBtn = document.getElementById('start');
const stopBtn = document.getElementById('stop');

submitElem.addEventListener('click', onSubmit);
startBtn.addEventListener('click', onStartColor);
stopBtn.addEventListener('click', onStopColor);

function onSubmit() {
    const inputElem = document.getElementById("inp1");
    const currentNumber = Number(inputElem.value);
    if (checkNumber(currentNumber)) {
        alert(`${errorMessage} ${currentNumber}`);
        return;
    }
    addBoxItem(currentNumber);
}

function addBoxItem(boxCount = 0) {
    let boxItems = [];
    if (boxCount === 0) {
        boxContainer.innerHTML = '';
        return;
    }

    for (let i = 0; i < boxCount; i++) {
        let htmlContent = `<div class="container-box-item">Div ${i + 1}</div>`;
        boxItems.push(htmlContent);
    }
    boxContainer.innerHTML = boxItems.join(' ');

}

function checkNumber(numberValue) {
    return Number.isNaN(numberValue) || numberValue < 0;
}

function onStartColor() {
    const inputElem = document.getElementById("inp2");
    const currentNumber = Number(inputElem.value);
    if (checkNumber(currentNumber)) {
        alert(`${errorMessage} ${currentNumber}`);
        return;
    }
    for (let boxItem of boxContainer.children) {
        intervalvalue.push(
            setInterval(function () {
                boxItem.style.background = getRandomColor();
            }, currentNumber * 1000)
        );
    }

}

function onStopColor() {
    for (let interval of intervalvalue) {
        clearInterval(interval);
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

