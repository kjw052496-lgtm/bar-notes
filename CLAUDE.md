# CLAUDE.md — 調酒配方站

> 每次開始工作前，先完整讀完這份文件，再讀 `data/tags.json` 與 `data/drinks.json`。
> 如果任務不屬於下面任何一個「流程」，先提出計畫給使用者確認，再動手。

---

## 1. 專案目的

- 一個靜態的調酒配方網站，每杯調酒都用 **技法／基底／家族** 三種分類標記，首頁可依這三種分類篩選。
- 讀者：想在家調酒的初學到中階玩家。
- 部署：GitHub Pages。純 HTML／CSS／JavaScript，**沒有框架、沒有建置步驟**。
- 核心原則：**資料和版面分開**。所有調酒資料只存在 `data/drinks.json`，HTML 只負責顯示。

---

## 2. 資料夾結構

```
CLAUDE.md
index.html                 首頁：調酒卡片列表 + 三種分類篩選
drink.html                 單杯調酒頁（共用版型），網址為 drink.html?d=<slug>
data/
  drinks.json              所有調酒資料（唯一來源）
  tags.json                所有分類標籤、杯型的封閉清單（唯一來源）
techniques/
  _template.html           技法頁範本（不要直接修改）
  <technique-id>.html      各技法頁，例如 fat-wash.html
assets/
  css/style.css            共用樣式
  js/main.js               共用腳本：讀 JSON、篩選、渲染
  img/                     圖片，檔名 = <slug>.jpg 或 <technique-id>.jpg
```

- 不要在根目錄或其他地方新增資料夾或檔案，除非使用者同意。
- 所有檔名、slug、標籤 id 一律用 **英文小寫 kebab-case**（例：`bentons-old-fashioned`）。

### 頁面怎麼運作
- 每個頁面的 `<body>` 用 `data-page` 告訴 `main.js` 要渲染什麼：`index`、`drink`、`technique`。
- 技法頁另外有 `data-technique="<technique-id>"` 和 `data-root=".."`（因為它在子資料夾裡）。
- 首頁支援網址篩選，例如 `index.html?technique=fat-wash`、`index.html?base=gin&family=martini`。
- 頁首只有網站名稱，沒有導覽列。首頁下方的「技法筆記」清單會自動列出 `tags.json` 中 `"page": true` 的技法，**新增技法頁時不需要改任何導覽**。

---

## 3. 視覺風格：深色酒吧感

色彩只能使用 `style.css` 中定義的 CSS 變數，不要在 HTML 或 JS 裡寫死顏色。

| 變數 | 色碼 | 用途 |
|---|---|---|
| `--bg` | `#14110f` | 背景（帶暖調的近黑） |
| `--surface` | `#1f1a17` | 卡片、區塊底色 |
| `--border` | `#3a322c` | 分隔線、外框 |
| `--text` | `#ece4d8` | 主要文字（米白） |
| `--muted` | `#a59a8c` | 次要文字 |
| `--accent` | `#c8963e` | 琥珀金：連結、按鈕、重點 |
| `--accent-2` | `#8b2e2e` | 酒紅：備註、提醒框 |
| `--pour-1` ～ `--pour-4` | `#c8963e` `#8b2e2e` `#e0c48a` `#6b4a2e` | 杯子圖示裡的液體分層，依材料順序循環 |

- 招牌元素：每杯調酒都畫成**對應杯型的杯子圖示**，杯中液體依材料份量分層（只計算 `ml` 和 `barspoon`）。由 `main.js` 自動產生，不要手畫。

- 字體（Google Fonts）：英文酒名用 `Playfair Display`；中文標題用 `Noto Serif TC`；內文用 `Noto Sans TC`。
- 版面：手機優先，內容最大寬度 `960px`，調酒以卡片呈現。
- 不使用 emoji 當圖示。
- 每頁頁尾固定顯示：`飲酒過量，有礙健康｜未成年請勿飲酒｜喝酒不開車`。

---

## 4. 語言規則

- 介面文字、說明、步驟：**繁體中文（台灣用語）**。
- 酒名：保留**英文原名**（`name`），可選填中文俗名（`name_zh`）。
- 材料名格式：`英文（中文）`，例：`Sweet vermouth（甜香艾酒）`。
- 語氣：簡潔、像酒保向客人說明，不用網路流行語。

---

## 5. 分類標籤（封閉清單）

標籤 **只能** 使用 `data/tags.json` 裡已有的 id。下表與 `tags.json` 必須保持一致。

### 技法 `technique`（每杯至少 1 個，可多個）
| id | 中文 | 定義 |
|---|---|---|
| `shake` | 搖盪 | 雪克杯加冰用力搖盪後濾出 |
| `stir` | 攪拌 | 攪拌杯加冰攪拌降溫後濾出 |
| `build` | 直調 | 材料直接倒進飲用的杯子裡完成（在杯中輕攪也算） |
| `muddle` | 搗壓 | 在杯中壓碎糖、水果或香草，釋出風味 |
| `fat-wash` | 油洗 | 用油脂替烈酒增添風味，需事先製作 |
| `infusion` | 浸漬 | 把食材泡在烈酒中萃取風味，需事先製作 |

### 基底 `base`（每杯至少 1 個，可多個）
| id | 中文 |
|---|---|
| `gin` | 琴酒 |
| `whiskey` | 威士忌（含波本、裸麥） |
| `rum` | 蘭姆酒 |
| `tequila` | 龍舌蘭（含梅斯卡爾） |
| `vodka` | 伏特加 |
| `brandy` | 白蘭地（含干邑） |

### 家族 `family`（每杯**只能 1 個**，依《Cocktail Codex》六大基本型）
| id | 中文 | 基本結構 |
|---|---|---|
| `old-fashioned` | 古典 | 烈酒 + 糖 + 苦精 |
| `martini` | 馬丁尼 | 烈酒 + 香艾酒等加香葡萄酒 |
| `daiquiri` | 黛綺莉 | 烈酒 + 酸 + 糖 |
| `sidecar` | 側車 | 烈酒 + 酸 + 利口酒 |
| `highball` | 高球 | 烈酒 + 氣泡或非酒精飲料延長 |
| `flip` | Flip | 烈酒 + 蛋或奶等增加濃郁度 |

### 杯型 `glass`（每杯 1 個）
`rocks` 古典杯、`coupe` 碟形杯、`nick-and-nora` 尼克諾拉杯、`highball` 高球杯、`martini` 馬丁尼杯（雞尾酒杯）、`flute` 笛型杯

每種杯型在 `main.js` 的 `GLASSES` 裡都有對應的杯子圖形。新增杯型屬於流程 C，而且要同時在 `GLASSES` 加上圖形。

### 單位 `unit`
`ml`、`dash`（苦精抖數）、`drop`（滴）、`barspoon`（吧匙，約 5 ml）、`piece`（個／片）、`top`（補滿）

---

## 6. 資料格式：`data/drinks.json`

`drinks.json` 是一個陣列，每杯調酒是一個物件：

```json
{
  "slug": "bentons-old-fashioned",
  "name": "Benton's Old Fashioned",
  "name_zh": "培根古典",
  "technique": ["fat-wash", "stir"],
  "base": ["whiskey"],
  "family": "old-fashioned",
  "glass": "rocks",
  "ingredients": [
    { "item": "Bacon fat-washed bourbon（培根油洗波本）", "amount": 60, "unit": "ml" },
    { "item": "Grade B maple syrup（B 級楓糖漿）", "amount": 7.5, "unit": "ml" },
    { "item": "Angostura bitters（安格仕苦精）", "amount": 2, "unit": "dash" }
  ],
  "steps": [
    "將所有材料倒入攪拌杯，加入冰塊。",
    "攪拌至充分降溫。",
    "濾入放有一顆大冰塊的古典杯。"
  ],
  "garnish": "柳橙皮",
  "note": "PDT 酒吧 Don Lee 的作品，把 fat-washing 帶進調酒界。培根油洗波本的做法請看油洗技法頁。",
  "source": "https://punchdrink.com/recipes/bentons-old-fashioned/",
  "added": "2026-11-13"
}
```

（這是 `drinks.json` 裡真實的一筆，可直接參考。）

| 欄位 | 必填 | 規則 |
|---|---|---|
| `slug` | ✔ | 英文 kebab-case，全站唯一，用於網址 |
| `name` | ✔ | 英文原名 |
| `name_zh` | | 中文俗名 |
| `technique` | ✔ | 陣列，至少 1 個，來自技法清單 |
| `base` | ✔ | 陣列，至少 1 個，來自基底清單 |
| `family` | ✔ | 字串，只能 1 個，來自家族清單 |
| `glass` | ✔ | 來自杯型清單 |
| `ingredients` | ✔ | 依倒入順序排列，見下方說明 |
| `steps` | ✔ | 每步一個動作，動詞開頭，句號結尾 |
| `garnish` | | 裝飾 |
| `note` | | 一句話：風味特色或小知識 |
| `source` | ✔ | 配方來源網址，**沒有來源就不能新增** |
| `added` | ✔ | 新增日期 `YYYY-MM-DD` |

每個材料 `{ "item", "amount", "unit" }`：
- `item`：格式 `英文（中文）`。
- `amount`：數字。以下兩種情況填 `null`，頁面會顯示「適量」或「補滿」：
  - `unit` 為 `top`；
  - 來源沒有給精確份量（例如 IBA 寫 *few dashes*）。**不要自己編一個數字。**
- 來源寫 oz 時換算成 ml：1 oz = 30 ml（¼ oz = 7.5 ml）。
- 可省略的材料加上 `"optional": true`，頁面會顯示「（可省略）」。

其他規則：
- 新增的調酒一律 **加在陣列最後**，不要重新排序。
- 需要事先製作的材料（例如油洗烈酒），在 `note` 裡指向對應的技法頁。

---

## 7. 工作流程

### 流程 A：新增一杯調酒
1. 確認配方有可靠來源。**不准自己編造配方或比例。**
2. 從 `tags.json` 挑選 technique、base、family、glass。清單不夠用 → **停下來問使用者**，不要自己加標籤。
3. 依第 6 節格式，在 `drinks.json` 陣列最後加一筆。
4. **不需要修改任何 HTML**：首頁、單杯頁、技法頁都會自動從 JSON 讀到新資料。
5. 執行第 8 節的檢查清單。

### 流程 B：新增技法頁
1. 確認該技法 id 已在 `tags.json` 中；沒有 → 先走流程 C。
2. 複製 `techniques/_template.html` 為 `techniques/<technique-id>.html`。
3. 修改 `<title>`、`<h1>`、英文名稱，並把 `<body>` 的 `data-technique` 改成技法 id。
4. 依序填寫固定區塊，不增減、不調換順序：
   1. 一句話說明
   2. 原理（為什麼有效）
   3. 器材
   4. 步驟（比例、適用的酒寫在步驟清單前的段落）
   5. 常見錯誤
   6. 安全注意（涉及生蛋、油脂保存、高溫等才需要，不需要就整段刪掉）
   7. 用到這個技法的調酒（由 JS 自動從 `drinks.json` 列出，**不要手寫**）
   8. 參考來源（至少 1 個，所有數字、時間、比例都要查得到出處）
5. 在 `tags.json` 中將該技法的 `"page"` 設為 `true`。首頁的「技法筆記」和單杯頁的技法標籤就會自動連到這頁。
6. 執行第 8 節的檢查清單。

### 流程 C：新增分類標籤
1. **必須先取得使用者同意。**
2. 同時更新 `data/tags.json` 和本文件第 5 節的表格。
3. id 用英文 kebab-case，並附上中文名稱。

---

## 8. 完成檢查清單

每次修改後都要確認：

- [ ] `python3 -m json.tool data/drinks.json` 與 `data/tags.json` 都能通過（JSON 合法）
- [ ] `slug` 沒有重複；用到的標籤都存在於 `tags.json`
- [ ] 首頁用技法、基底、家族三種篩選都找得到新內容
- [ ] `drink.html?d=<slug>` 可以正常顯示
- [ ] 手機寬度（375px）不破版
- [ ] 所有連結可以點開

本地預覽（直接開檔案會讀不到 JSON）：

```bash
python3 -m http.server 8000
# 打開 http://localhost:8000
```

---

## 9. 禁止事項

- 不准修改 `assets/css/style.css` 和 `assets/js/main.js`，要改風格或功能先問使用者。
- 不准刪除或改寫既有的調酒資料，除非使用者明確要求。
- 不准編造配方、比例或來源。
- 不准把調酒資料寫死在 HTML 裡。
- 不准引入框架、建置工具或外部 JS 函式庫（Google Fonts 除外）。

---

## 10. 回報格式

完成後用以下格式回報：

1. **改了哪些檔案**：列出新增／修改的檔案路徑
2. **新增了什麼**：調酒名稱、技法頁、標籤
3. **需要使用者確認的事**：例如來源可信度、標籤歸類有疑慮的地方
