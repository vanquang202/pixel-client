const url = "https://adpixel.jimdev.id.vn";
const canvas = document.getElementById("gameCanvas");
const context = canvas.getContext("2d");
let gridSize, rows, cols, grid, echo, idU;
let pause = [];
function createCursor(idU_F) {
  let element = document.createElement("div");
  element.setAttribute("id", idU_F);
  element.setAttribute("class", "mouse");
  element.innerHTML = idU_F;
  document.getElementById("body").appendChild(element);
}
function beginStart() {
  const firstNames = ["John", "Jane", "David", "Sarah", "Michael", "Emily"];
  const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Taylor"];

  function generateRandomName() {
    const randomFirstNameIndex = Math.floor(Math.random() * firstNames.length);
    const randomLastNameIndex = Math.floor(Math.random() * lastNames.length);
    const randomFirstName = firstNames[randomFirstNameIndex];
    const randomLastName = lastNames[randomLastNameIndex];
    const randomSuffix = Math.floor(Math.random() * 1000); // Số ngẫu nhiên từ 0 đến 999
    const randomName = randomFirstName + randomLastName + randomSuffix;

    return randomName;
  }
  const randomName = generateRandomName();
  document.getElementById("id").innerHTML = randomName;
  idU = randomName;
}

function start() {
  window.Echo = new Echo({
    broadcaster: "socket.io",
    host: `https://adpixel.jimdev.id.vn`,
    withCredentials: true,
  });
  echo = window.Echo.join("pixel")
    .here((users) => {
      console.log("U here ", users);
    })
    .joining((user) => {
      console.log("U join", user);
    })
    .leaving(async (user) => {});
  echo.listenForWhisper("pause", (event) => {
    pause.push(event);
    console.log(event);
  });
  window.onload = async function () {
    grid = [];

    echo.listenForWhisper("client-" + idU, (event) => {
      if (event.grid) grid.push(...JSON.parse(event.grid));
      console.log(grid);
      if (event.isDone) {
        canvasWidth = event.canvasWidth;
        canvasHeight = event.canvasHeight;
        gridSize = event.gridSize;
        rows = event.rows;
        cols = event.cols;
        run();
      }
    });

    function getClientGrid() {
      echo.whisper("call", {
        idU: idU,
      });
    }
    getClientGrid();

    function run() {
      if (pause.length > 0) {
        for (let index = 0; index < pause.length; index++) {
          const event = pause[index];
          context.fillStyle = event.selectedColor;
          context.fillRect(
            event.col,
            event.row,
            event.gridSize,
            event.gridSize
          );
        }
      }
      echo.listenForWhisper("send-client", (event) => {
        context.fillStyle = event.selectedColor;
        context.fillRect(event.col, event.row, event.gridSize, event.gridSize);

        // mouse
        if (!document.getElementById(event.idU)) createCursor(event.idU);
        const cursor = document.getElementById(event.idU);
        cursor.style.setProperty("--mouseX", event.mouseX + "px");
        cursor.style.setProperty("--mouseY", event.mouseY + "px");
        setTimeout(() => {
          cursor.remove();
        }, 1000);
      });

      let colorPicker = document.getElementById("colorPicker");
      let selectedColor = colorPicker.value;
      colorPicker.addEventListener("change", function (event) {
        selectedColor = event.target.value;
      });

      canvas.addEventListener("mousedown", async function (event) {
        const audio = document.createElement("video");
        audio.src = "./click.mp3";
        audio.play();
        let rect = canvas.getBoundingClientRect();
        let mouseX = event.clientX - rect.left;
        let mouseY = event.clientY - rect.top;

        let clickedRow = Math.floor(mouseY / gridSize);
        let clickedCol = Math.floor(mouseX / gridSize);
        grid[clickedRow][clickedCol] = selectedColor;
        context.fillStyle = selectedColor;
        context.fillRect(
          clickedCol * gridSize,
          clickedRow * gridSize,
          gridSize,
          gridSize
        );

        await echo.whisper("send-client", {
          col: clickedCol * gridSize,
          row: clickedRow * gridSize,
          gridSize: gridSize,
          selectedColor: selectedColor,
          idU: idU,
          mouseX: mouseX,
          mouseY: mouseY,
          clickedRow: clickedRow,
          clickedCol: clickedCol,
        });
        await echo.whisper("pause", {
          col: clickedCol * gridSize,
          row: clickedRow * gridSize,
          gridSize: gridSize,
          selectedColor: selectedColor,
          idU: idU,
          mouseX: mouseX,
          mouseY: mouseY,
          clickedRow: clickedRow,
          clickedCol: clickedCol,
        });
      });

      function drawGrid() {
        document.getElementById("loading").style.display = "none";
        context.clearRect(0, 0, canvasWidth, canvasHeight);
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            if (grid[row][col]) {
              context.fillStyle = grid[row][col];
              context.fillRect(
                col * gridSize,
                row * gridSize,
                gridSize,
                gridSize
              );
            }
          }
        }
      }
      drawGrid();
    }
  };
}
beginStart();
start();

// Until
function prt() {
  let screenshotImage = document.createElement("img");

  // Chuyển đổi nội dung của canvas thành URL dữ liệu hình ảnh
  let dataURL = canvas.toDataURL("image/png");
  screenshotImage.style.width = "100%";
  screenshotImage.style.height = "100%";
  screenshotImage.src = dataURL;
  let prt = document.getElementById("prt");
  let s = document.getElementById("s");
  prt.style.display = "block";
  s.innerHTML = "";
  s.appendChild(screenshotImage);
}

function cancelView() {
  let prt = document.getElementById("prt");
  prt.style.display = "none";
}
function handleZoom(event) {
  if (event.ctrlKey === true || event.metaKey) {
  }
}

window.addEventListener("wheel", handleZoom, { passive: false });
window.addEventListener("gesturestart", handleZoom);
