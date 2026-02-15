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

### Universal_equipment.gs

```js
function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheetName;
  
  // Проверяем входящие параметры, чтобы решить, какую логику применить
  
  if (e && e.parameter && e.parameter.type === "milling") {
    // 1. ЛОГИКА ВАШЕЙ ПЕРВОЙ ФУНКЦИИ (MillingMachines)
    sheetName = "MillingMachines";
    
  } else if (e && e.parameter && e.parameter.type === "equipment") {
    // 2. НОВАЯ ЛОГИКА ДЛЯ ВАШЕЙ ТАБЛИЦЫ (Universal_equipment)
    sheetName = "Universal_equipment";
    
  } else {
    // 3. ЛОГИКА ВАШЕЙ ВТОРОЙ ФУНКЦИИ (TurningMachines по умолчанию или другой тип)
    // Эта часть кода сохраняет работу вашей конструкции: e.parameter.type || "TurningMachines"
    sheetName = (e && e.parameter && e.parameter.type) || "TurningMachines";
  }

  // ОБЩАЯ ЧАСТЬ ПОЛУЧЕНИЯ ДАННЫХ (которая была в обеих ваших функциях)
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    return ContentService.createTextOutput(JSON.stringify({error: "Лист '" + sheetName + "' не найден"}))
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
```

### MillingMachines (sheet)

Станок	Ост (A)	Инстр. (T)	Точность (GA)	Круг. инт. (CI)	Оснастка	Renishaw (R)	Отриц. ось (NA)	Шпиндель (S)	СОЖ (C)	Пов. гол. (AH)	Расточка (BB)	Габариты (AxBxC / DxL)	Сложность (G)
Eco_S	A3	T20	GA10	CI5	Тиски 3 оси	R-	NA-	S6	C-	AH-	BB-	300x200x150	G1
Eco_H	A3	T16	GA10	CI5	Патрон	R-	NA-	S8	C-	AH-	BB-	D100xL150	G2
Evo_M	A31	T24	GA5	CI3	Тиски 3 оси	R+	NA-	S10	C+	AH-	BB+	500x400x300	G3
Evo_H	A4	T30	GA5	CI2	Тиски 5 осей	R+	NA+	S12	C+	AH-	BB+	400x400x400	G3
Chiron_1	A32	T40	GA3	CI2	Раптор	R+	NA-	S15	C+	AH+	BB-	200x150x100	G4
Chiron_2	A41	T40	GA3	CI2	Спец осн.	R+	NA+	S15	C+	AH+	BB-	250x200x150	G4
Grosver_V856	A3	T24	GA5	CI3	Тиски 3 оси	R-	NA-	S8	C+	AH-	BB+	800x500x500	G2
Hedelius	A5	T60	GA2	CI1	Тиски 5 осей	R+	NA+	S18	C+	AH+	BB+	1000x600x600	G5
DMU 40MB	A5	T30	GA3	CI2	Раптор	R+	NA+	S20	C+	AH+	BB+	400x400x400	G5
Mitsui Seiki	A5	T120	GA1	CI1	Спец осн.	R+	NA+	S15	C+	AH+	BB+	600x600x500	G5

### TurningMachines (sheet)

Станок	Приводной инстр. (DT)	Кол-во инстр. (T)	Точность по X (GAX)	Точность по Z (GAZ)	Группа оснастки	Обороты шпинделя (S)	Задняя бабка (TT)	Габариты (DxL)	Группа сложн. (G)
Weiler	DT-	T8	GAX2	GAZ2	Патрон	S3	TT+	D200xL500	G2
Twin 42	DT+	T24	GAX3	GAZ3	Цанга	S6	TT-	D42xL150	G4
Hwacheon	DT+	T12	GAX5	GAZ5	Патрон	S4	TT+	D300xL600	G3
Nakamura	DT+	T16	GAX2	GAZ2	Цанга / Патрон	S5	TT+	D250xL400	G5
Romi 240	DT-	T8	GAX5	GAZ10	Патрон	S3	TT+	D240xL400	G1
Romi 280	DT-	T12	GAX5	GAZ8	Патрон	S2	TT+	D280xL800	G2

### Universal_equipment (sheet)

Тип	Номер в SAP	Название оснастки	Кол-во	Артикул производителя	Комментарий
Базы/Проставки	60000000002	База Erowa L=55	2		Chiron / Evo
Базы/Проставки	60000000003	База Erowa L=105	1		База предназначена для  станка Ecoline
Базы/Проставки	60000000004	База Erowa L=125	1		База предназначена для  станка Ecoline
Базы/Проставки	60000000005	База LANG L=27	8	45150	
Базы/Проставки	60000000006	Проставка LANG L=60	5	45156	 (Chiron / Evo)
Базы/Проставки	60000000007	Проставка LANG L=100	3	45157	 (Ecoline / Evo)
Тиски	60000000008	Тиски LANG 46 L=102	1	48085-46 FS	


