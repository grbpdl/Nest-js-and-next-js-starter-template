import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  constructor() {}

  welcomePage() {
    const date = new Date();

    return `<html><head><title>
      ${process.env.APP_NAME}
    </title></head>
      <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Arial, sans-serif;
      }
      .main {
        width: 100vw;
        height: 100vh;
        background-color: black;
        color: white;
        font-face: mono;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-direction: column;
      }

      h1 {
        color: white;
        font-size: 42px;
      }
      span {
        font-size: 14px;
        margin-top: 8px;
      }
      </style>
      <body>
        <div class='main'>
            <h1>${process.env.APP_TITLE}</h1>
            <span>©${date}</span>
        </div>
      </body>
    </html>`;
  }
}
