# Grosver TechProcess Pro

Это приложение для проектирования технологических процессов производства деталей. Приложение позволяет создавать иерархические структуры изделий с возможностью описания технологических операций, выбора оборудования, инструментов и оснастки.

## Особенности

- Иерархическое проектирование изделий
- Поддержка различных типов операций (токарные, фрезерные, заготовительные и др.)
- Управление оборудованием, инструментами и оснасткой
- Экспорт данных в формате TXT
- Автоматическое сохранение данных в localStorage

## Установка и запуск

1. Клонируйте репозиторий
2. Установите зависимости: `npm install`
3. Запустите приложение: `npm run dev`

## Деплой на GitHub Pages

Для деплоя на GitHub Pages выполните команду:
```bash
npm run deploy
```

Приложение будет доступно по адресу: `https://<your-username>.github.io/<repository-name>/`

## Технологии

- React
- TypeScript
- Vite
- Tailwind CSS (предположительно, по классам в коде)

## Google sheet

```js
function doGet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("MillingMachines");
  const data = sheet.getDataRange().getValues();
  
  const headers = data[0];
  const rows = data.slice(1);
  
  // Превращаем массив массивов в массив объектов (JSON)
  const json = rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}
// [
//   {
//     "Станок": "Eco_S",
//     "Ост (A)": "A3",
//     "Инстр. (T)": "T20",
//     "Точность (GA)": "GA10",
//     "Круг. инт. (CI)": "CI5",
//     "Оснастка": "Тиски 3 оси",
//     "Renishaw (R)": "R-",
//     "Отриц. ось (NA)": "NA-",
//     "Шпиндель (S)": "S6",
//     "СОЖ (C)": "C-",
//     "Пов. гол. (AH)": "AH-",
//     "Расточка (BB)": "BB-",
//     "Габариты (AxBxC / DxL)": "300x200x150",
//     "Сложность (G)": "G1"
//   },
//   {
//     "Станок": "Evo_M",
//     "Ост (A)": "A31",
//     "Инстр. (T)": "T24",
//     "Точность (GA)": "GA5",
//     "Круг. инт. (CI)": "CI3",
//     "Оснастка": "Тиски 3 оси",
//     "Renishaw (R)": "R+",
//     "Отриц. ось (NA)": "NA-",
//     "Шпиндель (S)": "S10",
//     "СОЖ (C)": "C+",
//     "Пов. гол. (AH)": "AH-",
//     "Расточка (BB)": "BB+",
//     "Габариты (AxBxC / DxL)": "500x400x300",
//     "Сложность (G)": "G3"
//   },
//   {
//     "Станок": "Mitsui Seiki",
//     "Ост (A)": "A5",
//     "Инстр. (T)": "T120",
//     "Точность (GA)": "GA1",
//     "Круг. инт. (CI)": "CI1",
//     "Оснастка": "Спец осн.",
//     "Renishaw (R)": "R+",
//     "Отриц. ось (NA)": "NA+",
//     "Шпиндель (S)": "S15",
//     "СОЖ (C)": "C+",
//     "Пов. гол. (AH)": "AH+",
//     "Расточка (BB)": "BB+",
//     "Габариты (AxBxC / DxL)": "600x600x500",
//     "Сложность (G)": "G5"
//   }
// ]
// Пример доступа к первому станку в массиве
// console.log(data[0]["Станок"]);        // "Eco_S"
// console.log(data[0]["Ост (A)"]);       // "A3"
// console.log(data[0]["Шпиндель (S)"]);  // "S6"

// // Пример фильтрации станков только с Renishaw (R+)
// const withRenishaw = data.filter(item => item["Renishaw (R)"] === "R+");
```

```js
function doGet(e) {
  // Получаем параметр из URL (по умолчанию "TurningMachines")
  const sheetName = e.parameter.type || "TurningMachines"; 
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Лист не найден"}))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = data.slice(1);
  
  const json = rows.map(row => {
    let obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
  
  return ContentService.createTextOutput(JSON.stringify(json))
    .setMimeType(ContentService.MimeType.JSON);
}
// [
//   {
//     "Станок": "Eco_S",
//     "Ост (A)": "A3",
//     "Инстр. (T)": "T20",
//     "Точность (GA)": "GA10",
//     "Круг. инт. (CI)": "CI5",
//     "Оснастка": "Тиски 3 оси",
//     "Renishaw (R)": "R-",
//     "Отриц. ось (NA)": "NA-",
//     "Шпиндель (S)": "S6",
//     "СОЖ (C)": "C-",
//     "Пов. гол. (AH)": "AH-",
//     "Расточка (BB)": "BB-",
//     "Габариты (AxBxC / DxL)": "300x200x150",
//     "Сложность (G)": "G1"
//   },
//   {
//     "Станок": "Evo_M",
//     "Ост (A)": "A31",
//     "Инстр. (T)": "T24",
//     "Точность (GA)": "GA5",
//     "Круг. инт. (CI)": "CI3",
//     "Оснастка": "Тиски 3 оси",
//     "Renishaw (R)": "R+",
//     "Отриц. ось (NA)": "NA-",
//     "Шпиндель (S)": "S10",
//     "СОЖ (C)": "C+",
//     "Пов. гол. (AH)": "AH-",
//     "Расточка (BB)": "BB+",
//     "Габариты (AxBxC / DxL)": "500x400x300",
//     "Сложность (G)": "G3"
//   },
//   {
//     "Станок": "Mitsui Seiki",
//     "Ост (A)": "A5",
//     "Инстр. (T)": "T120",
//     "Точность (GA)": "GA1",
//     "Круг. инт. (CI)": "CI1",
//     "Оснастка": "Спец осн.",
//     "Renishaw (R)": "R+",
//     "Отриц. ось (NA)": "NA+",
//     "Шпиндель (S)": "S15",
//     "СОЖ (C)": "C+",
//     "Пов. гол. (AH)": "AH+",
//     "Расточка (BB)": "BB+",
//     "Габариты (AxBxC / DxL)": "600x600x500",
//     "Сложность (G)": "G5"
//   }
// ]
// Пример доступа к первому станку в массиве
// console.log(data[0]["Станок"]);        // "Eco_S"
// console.log(data[0]["Ост (A)"]);       // "A3"
// console.log(data[0]["Шпиндель (S)"]);  // "S6"

// // Пример фильтрации станков только с Renishaw (R+)
// const withRenishaw = data.filter(item => item["Renishaw (R)"] === "R+");
```

### Типа сама

**Табилица фрезерка**

Станок	Ост (A)	Инстр. (T)	Точность (GA)	Круг. инт. (CI)	Оснастка	Renishaw (R)	Отриц. ось (NA)	Шпиндель (S)	СОЖ (C)	Пов. гол. (AH)	Расточка (BB)	Габариты (AxBxC / DxL)	Сложность (G)	Контроль (N)	Точн. контр. (NP)
Eco_S	A3	T20	GA10	CI5	Тиски 3 оси	R-	NA-	S6	C-	AH-	BB-	300x200x150	G1	N10x10	NP1x100
Eco_H	A3	T16	GA10	CI5	Патрон	R-	NA-	S8	C-	AH-	BB-	D100xL150	G2	N20x15	NP2x100
Evo_M	A31	T24	GA5	CI3	Тиски 3 оси	R+	NA-	S10	C+	AH-	BB+	500x400x300	G3	N40x20	NP4x100
Evo_H	A4	T30	GA5	CI2	Тиски 5 осей	R+	NA+	S12	C+	AH-	BB+	400x400x400	G3	N45x25	NP5x100
Chiron_1	A32	T40	GA3	CI2	Раптор	R+	NA-	S15	C+	AH+	BB-	200x150x100	G4	N60x20	NP8x100
Chiron_2	A41	T40	GA3	CI2	Спец осн.	R+	NA+	S15	C+	AH+	BB-	250x200x150	G4	N65x20	NP10x100
Grosver_V856	A3	T24	GA5	CI3	Тиски 3 оси	R-	NA-	S8	C+	AH-	BB+	800x500x500	G2	N30x15	NP3x100
Hedelius	A5	T60	GA2	CI1	Тиски 5 осей	R+	NA+	S18	C+	AH+	BB+	1000x600x600	G5	N100x50	NP20x100
DMU 40MB	A5	T30	GA3	CI2	Раптор	R+	NA+	S20	C+	AH+	BB+	400x400x400	G5	N80x20	NP15x100
Mitsui Seiki	A5	T120	GA1	CI1	Спец осн.	R+	NA+	S15	C+	AH+	BB+	600x600x500	G5	N150x100	NP40x100

**Таблица токарка**

Станок	Приводной инстр. (DT)	Кол-во инстр. (T)	Точность по X (GAX)	Точность по Z (GAZ)	Группа оснастки	Обороты шпинделя (S)	Задняя бабка (TT)	Габариты (DxL)	Группа сложн. (G)	Общий контроль (N)	Точный контроль (NP)
Weiler	DT-	T8	GAX2	GAZ2	Патрон	S3	TT+	D200xL500	G2	N15x20	NP3x100
Twin 42	DT+	T24	GAX3	GAZ3	Цанга	S6	TT-	D42xL150	G4	N50x20	NP8x100
Hwacheon	DT+	T12	GAX5	GAZ5	Патрон	S4	TT+	D300xL600	G3	N30x15	NP5x100
Nakamura	DT+	T16	GAX2	GAZ2	Цанга / Патрон	S5	TT+	D250xL400	G5	N60x25	NP12x100
Romi 240	DT-	T8	GAX5	GAZ10	Патрон	S3	TT+	D240xL400	G1	N10x10	NP2x100
Romi 280	DT-	T12	GAX5	GAZ8	Патрон	S2	TT+	D280xL800	G2	N20x20	NP4x100

