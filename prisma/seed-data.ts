// Seed data cho course "Tiếng Anh 10 — Global Success (Unit 1-3)"
// Video URLs là placeholder — admin có thể cập nhật qua UI quản trị.

const PLACEHOLDER_VIDEO = "https://www.youtube.com/watch?v=JsNvHm-oAxc";

export type SeedLesson = {
  title: string;
  videoUrl: string;
  content: string;
  quiz?: Array<{
    question: string;
    options: string[];
    correctIndex: number;
  }>;
};

export type SeedModule = {
  title: string;
  lessons: SeedLesson[];
};

export const englishCourseModules: SeedModule[] = [
  {
    title: "Unit 1: Family Life",
    lessons: [
      {
        title: "Getting Started — Family Life",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 1 — Getting Started

## Mục tiêu bài học
- Làm quen chủ đề **gia đình** và các hoạt động trong gia đình.
- Học một số từ vựng nền tảng.
- Nghe đoạn hội thoại ngắn về việc nhà.

## Tình huống mở đầu
Mai và Nam đang nói chuyện về công việc nhà trong gia đình mỗi người. Bạn hãy lắng nghe và trả lời các câu hỏi sau:

1. Mai usually does what at home?
2. Who takes out the trash in Nam's house?

## Từ vựng nổi bật
- **household chore** /ˈhaʊshəʊld tʃɔːr/ — việc vặt trong nhà
- **share** /ʃeər/ — chia sẻ
- **responsibility** /rɪˌspɒnsəˈbɪləti/ — trách nhiệm

> 💡 Tip: Ghi chú lại các cụm động từ chỉ việc nhà trong vở. Chúng sẽ xuất hiện nhiều ở các bài sau.`,
      },
      {
        title: "Vocabulary — Household chores & responsibility",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 1 — Vocabulary: Household Chores

## 📚 Từ vựng chính

| English             | Phonetic          | Vietnamese         |
|---------------------|-------------------|--------------------|
| housework           | /ˈhaʊswɜːrk/      | việc nhà           |
| chore               | /tʃɔːr/           | việc vặt           |
| responsibility      | /rɪˌspɒnsəˈbɪləti/| trách nhiệm        |
| do the laundry      | -                 | giặt giũ           |
| sweep the floor     | -                 | quét nhà           |
| take out the trash  | -                 | đổ rác             |
| water the plants    | -                 | tưới cây           |
| do the dishes       | -                 | rửa bát            |
| make the bed        | -                 | dọn giường         |
| iron clothes        | -                 | là quần áo         |

## 💡 Cụm động từ thường dùng
- **do the dishes** — rửa bát
- **make the bed** — dọn giường
- **cook meals** — nấu ăn
- **iron clothes** — là quần áo

## ✍️ Ví dụ
> *"In my family, everyone has their own **responsibility**. I usually **do the dishes** after dinner, while my brother **takes out the trash**."*

## 🎯 Mục tiêu sau bài học
- Biết ít nhất 15 từ vựng về việc nhà
- Dùng được các cụm từ trong câu hoàn chỉnh
- Hoàn thành quiz cuối bài đạt ≥ 70%`,
        quiz: [
          {
            question: "Which word means 'làm việc nhà'?",
            options: ["Housework", "Homework", "Housekeeper", "Housing"],
            correctIndex: 0,
          },
          {
            question: "'To do the laundry' nghĩa là gì?",
            options: ["Lau nhà", "Giặt giũ", "Nấu ăn", "Đi chợ"],
            correctIndex: 1,
          },
          {
            question: "Choose the correct word: 'My mother often ____ the dishes after dinner.'",
            options: ["wash", "washes", "washing", "washed"],
            correctIndex: 1,
          },
          {
            question: "Which is NOT a household chore?",
            options: ["Sweeping the floor", "Watering plants", "Playing games", "Taking out the trash"],
            correctIndex: 2,
          },
          {
            question: "'Responsibility' có nghĩa là gì?",
            options: ["Trách nhiệm", "Sự tự do", "Sự nghỉ ngơi", "Sự giải trí"],
            correctIndex: 0,
          },
        ],
      },
      {
        title: "Grammar — Present simple vs Present continuous",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 1 — Grammar: Present Simple vs Present Continuous

## 1. Present Simple (Thì hiện tại đơn)
**Dùng để diễn tả:**
- Thói quen, hành động lặp lại: *I go to school every day.*
- Sự thật hiển nhiên: *Water boils at 100°C.*
- Sở thích, cảm xúc: *I love my family.*

**Cấu trúc:**
- (+) S + V(s/es) + O
- (-) S + do/does + not + V + O
- (?) Do/Does + S + V + O?

**Dấu hiệu:** every day, often, usually, always, sometimes, rarely, never.

## 2. Present Continuous (Thì hiện tại tiếp diễn)
**Dùng để diễn tả:**
- Hành động đang xảy ra tại thời điểm nói: *She is cooking now.*
- Hành động tạm thời: *I am living in Hanoi this month.*

**Cấu trúc:**
- (+) S + am/is/are + V-ing + O
- (-) S + am/is/are + not + V-ing + O
- (?) Am/Is/Are + S + V-ing + O?

**Dấu hiệu:** now, at the moment, right now, look!, listen!

## ✍️ So sánh
| Present Simple                 | Present Continuous              |
|---------------------------------|---------------------------------|
| She **does** her homework daily | She **is doing** her homework now |
| It often **rains** in summer   | It **is raining** now            |

## 🎯 Lưu ý
- Một số động từ KHÔNG dùng ở thì tiếp diễn (stative verbs): love, hate, know, understand, want, need.`,
        quiz: [
          {
            question: "Choose the correct tense: 'She ____ to school every day.'",
            options: ["go", "goes", "is going", "went"],
            correctIndex: 1,
          },
          {
            question: "'Look! The baby ____' — which is correct?",
            options: ["cry", "cries", "is crying", "cried"],
            correctIndex: 2,
          },
          {
            question: "Present simple dùng để diễn tả điều gì?",
            options: [
              "Hành động đang xảy ra lúc nói",
              "Thói quen, sự thật hiển nhiên",
              "Hành động đã hoàn thành",
              "Dự định tương lai",
            ],
            correctIndex: 1,
          },
          {
            question: "Which verb is NOT used in continuous tense?",
            options: ["run", "love", "play", "study"],
            correctIndex: 1,
          },
        ],
      },
      {
        title: "Reading — Family bonds and routines",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 1 — Reading: Family Bonds

## Đoạn văn ngắn
*The Nguyen family lives in a small house in Hanoi. Mr. Nguyen works as an engineer, and his wife is a teacher. They have two children: Lan, who is 16, and Tuan, who is 12. Every weekend, the whole family does the household chores together. Mr. Nguyen takes out the trash, his wife does the laundry, Lan sweeps the floor, and Tuan waters the plants. After finishing, they cook lunch together and share stories about the week.*

## Comprehension questions
1. Where does the Nguyen family live?
2. What does Mr. Nguyen do for a living?
3. Who waters the plants on weekends?
4. What do they do after finishing chores?

## Reading skills
- **Skimming** — đọc lướt để nắm ý chính
- **Scanning** — tìm thông tin cụ thể (tên, số, ngày)
- **Context clues** — đoán nghĩa từ qua ngữ cảnh

## Từ vựng cần chú ý
- **bond** /bɒnd/ — sự gắn kết
- **routine** /ruːˈtiːn/ — thói quen hằng ngày
- **share** /ʃeər/ — chia sẻ`,
      },
      {
        title: "Listening + Speaking practice",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 1 — Listening + Speaking

## 🎧 Listening
Lắng nghe đoạn hội thoại giữa Mai và Hoa về công việc nhà. Trả lời các câu hỏi:

1. What chore does Mai do every Sunday?
2. Who in Hoa's family does the cooking?
3. Why does Hoa enjoy doing chores?

## 🗣️ Speaking — Role play
**Tình huống:** Bạn và bạn cùng phòng đang phân chia việc nhà cho tuần mới.

**Phrases hữu ích:**
- *Can you help me with...?*
- *I'll do the dishes if you...*
- *Let's take turns to...*
- *That's not fair! I always...*

## 💬 Mẫu câu
- *In my family, we share the housework.*
- *I usually do the dishes after dinner.*
- *My brother is responsible for taking out the trash.*

## 🎯 Mục tiêu sau bài
- Nghe và hiểu các cuộc hội thoại đơn giản về việc nhà
- Trao đổi ý kiến về phân chia việc nhà bằng tiếng Anh`,
        quiz: [
          {
            question: "Khi nghe hội thoại lần đầu, bạn nên tập trung vào điều gì?",
            options: [
              "Tất cả từng từ một",
              "Ý chính và keywords",
              "Cách phát âm",
              "Ngữ pháp",
            ],
            correctIndex: 1,
          },
          {
            question: "'Let's take turns' nghĩa là gì?",
            options: [
              "Hãy nhường nhau",
              "Hãy làm cùng nhau",
              "Hãy thay phiên nhau",
              "Hãy bỏ qua",
            ],
            correctIndex: 2,
          },
          {
            question: "Câu nào lịch sự nhất khi nhờ giúp đỡ?",
            options: [
              "Do this for me!",
              "Help me now.",
              "Could you help me with this, please?",
              "I need help!",
            ],
            correctIndex: 2,
          },
        ],
      },
    ],
  },
  {
    title: "Unit 2: Humans and the Environment",
    lessons: [
      {
        title: "Getting Started — Environment problems",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 2 — Getting Started

## Chủ đề: Con người và Môi trường
Hôm nay chúng ta sẽ thảo luận về các vấn đề môi trường: ô nhiễm, biến đổi khí hậu, và những gì chúng ta có thể làm.

## Tình huống mở đầu
Lan và Minh đang nói chuyện về tình trạng môi trường ở thành phố. Lan lo lắng về ô nhiễm không khí, còn Minh quan tâm đến rác thải nhựa.

## Brainstorming
- Những vấn đề môi trường nào bạn thấy ở khu vực mình sống?
- Bạn nghĩ ai chịu trách nhiệm cho việc bảo vệ môi trường?

## Từ vựng khởi động
- **pollution** /pəˈluːʃn/ — sự ô nhiễm
- **climate change** — biến đổi khí hậu
- **plastic waste** — rác thải nhựa
- **deforestation** /diːˌfɒrɪˈsteɪʃn/ — nạn phá rừng`,
      },
      {
        title: "Vocabulary — Environmental issues",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 2 — Vocabulary: Environmental Issues

## 📚 Từ vựng chính

| English              | Phonetic          | Vietnamese          |
|----------------------|-------------------|---------------------|
| pollution            | /pəˈluːʃn/        | ô nhiễm             |
| environment          | /ɪnˈvaɪrənmənt/   | môi trường          |
| recycle              | /ˌriːˈsaɪkl/      | tái chế             |
| waste                | /weɪst/           | rác thải            |
| protect              | /prəˈtekt/        | bảo vệ              |
| reduce               | /rɪˈdjuːs/        | giảm                |
| greenhouse effect    | -                 | hiệu ứng nhà kính   |
| global warming       | -                 | nóng lên toàn cầu   |
| endangered species   | -                 | loài có nguy cơ tuyệt chủng |
| renewable energy     | -                 | năng lượng tái tạo  |

## 💡 3R Principle
- **Reduce** — giảm tiêu thụ
- **Reuse** — tái sử dụng
- **Recycle** — tái chế

## ✍️ Ví dụ
> *"We should **reduce** plastic use and **recycle** more to **protect** our **environment**."*`,
        quiz: [
          {
            question: "'Pollution' nghĩa là gì?",
            options: ["Bảo vệ", "Ô nhiễm", "Tái chế", "Phát triển"],
            correctIndex: 1,
          },
          {
            question: "Which is NOT one of the 3Rs?",
            options: ["Reduce", "Reuse", "Recycle", "Remove"],
            correctIndex: 3,
          },
          {
            question: "'Renewable energy' bao gồm:",
            options: [
              "Năng lượng mặt trời, gió, nước",
              "Than đá, dầu mỏ",
              "Khí gas tự nhiên",
              "Tất cả đều đúng",
            ],
            correctIndex: 0,
          },
          {
            question: "Choose the correct word: 'We should ____ our environment.'",
            options: ["pollute", "protect", "destroy", "ignore"],
            correctIndex: 1,
          },
        ],
      },
      {
        title: "Grammar — Comparative & superlative adjectives",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 2 — Grammar: Comparative & Superlative

## 1. Tính từ ngắn (1 âm tiết)
- **Comparative:** Adj + **-er** + than → *taller, faster, smaller*
- **Superlative:** the + Adj + **-est** → *the tallest, the fastest*

## 2. Tính từ dài (2+ âm tiết)
- **Comparative:** **more** + Adj + than → *more beautiful, more important*
- **Superlative:** the **most** + Adj → *the most beautiful*

## 3. Tính từ bất quy tắc
| Adjective | Comparative | Superlative |
|-----------|-------------|-------------|
| good      | better      | the best    |
| bad       | worse       | the worst   |
| far       | farther     | the farthest|
| many/much | more        | the most    |
| little    | less        | the least   |

## ✍️ Ví dụ trong chủ đề môi trường
> *"Air pollution is **worse** in big cities than in the countryside."*
> *"Plastic is **the most common** waste in the ocean."*
> *"Solar energy is **cleaner than** coal."*

## ⚠️ Lưu ý spelling
- big → big**g**er, big**g**est (gấp đôi phụ âm)
- happy → happ**i**er, happ**i**est (y → i)
- nice → nice**r**, nice**st** (đã có e, chỉ thêm r/st)`,
        quiz: [
          {
            question: "Comparative form của 'good' là gì?",
            options: ["gooder", "more good", "better", "best"],
            correctIndex: 2,
          },
          {
            question: "Superlative của 'beautiful':",
            options: ["beautifulest", "more beautiful", "the most beautiful", "beautifuler"],
            correctIndex: 2,
          },
          {
            question: "Choose correct: 'Hanoi is ___ than my hometown.'",
            options: ["big", "bigger", "biggest", "more big"],
            correctIndex: 1,
          },
          {
            question: "'The Pacific Ocean is ____ ocean in the world.'",
            options: ["large", "larger", "the largest", "the most large"],
            correctIndex: 2,
          },
        ],
      },
      {
        title: "Reading — Plastic pollution",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 2 — Reading: Plastic Pollution

## Đoạn văn
*Plastic pollution is one of the most serious environmental problems today. Every year, about 8 million tons of plastic enter the ocean, harming marine life. Many sea animals like turtles and fish mistake plastic for food and die. The problem is that plastic does not biodegrade — it can stay in the environment for hundreds of years.*

*To solve this problem, we need to act now. First, we should reduce the use of single-use plastic items like straws and bags. Second, we can recycle plastic bottles and containers. Finally, governments and companies must invest in cleaner alternatives.*

## Comprehension
1. How much plastic enters the ocean each year?
2. Why is plastic so dangerous to the environment?
3. What are three solutions mentioned in the passage?

## Vocabulary in context
- **biodegrade** /ˌbaɪəʊdɪˈɡreɪd/ — phân hủy sinh học
- **marine life** — sinh vật biển
- **single-use** — dùng một lần
- **invest** /ɪnˈvest/ — đầu tư

## Discussion
- Bạn đã làm gì để giảm rác thải nhựa?
- Theo bạn, ai có trách nhiệm chính trong việc giải quyết vấn đề này?`,
      },
      {
        title: "Listening + Project ideas",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 2 — Listening + Project

## 🎧 Listening
Lắng nghe một bài phỏng vấn với chuyên gia môi trường về biến đổi khí hậu.

## 📋 Project ideas
**Đề xuất 1:** Khảo sát thói quen sử dụng nhựa của lớp bạn. Tạo biểu đồ và đề xuất giải pháp.

**Đề xuất 2:** Thiết kế poster tiếng Anh cổ động "Save the Planet" cho lớp.

**Đề xuất 3:** Phỏng vấn 5 người về môi trường, viết báo cáo ngắn (200 từ).

## Vocabulary for projects
- **survey** /ˈsɜːveɪ/ — khảo sát
- **interview** /ˈɪntəvjuː/ — phỏng vấn
- **awareness** /əˈweənəs/ — nhận thức
- **campaign** /kæmˈpeɪn/ — chiến dịch`,
        quiz: [
          {
            question: "'Survey' nghĩa là gì?",
            options: ["Báo cáo", "Khảo sát", "Phỏng vấn", "Bài luận"],
            correctIndex: 1,
          },
          {
            question: "Which is the best way to raise awareness?",
            options: [
              "Ignore the problem",
              "Make a poster and share information",
              "Complain on social media",
              "Wait for others to act",
            ],
            correctIndex: 1,
          },
          {
            question: "'Campaign' có nghĩa là:",
            options: ["Khẩu hiệu", "Chiến dịch", "Quảng cáo", "Đối thoại"],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
  {
    title: "Unit 3: Music",
    lessons: [
      {
        title: "Getting Started — Talking about music",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 3 — Getting Started

## Chủ đề: Âm nhạc
Âm nhạc là một phần không thể thiếu trong cuộc sống. Trong unit này, bạn sẽ học cách:
- Nói về thể loại âm nhạc yêu thích
- Mô tả nhạc cụ và nghệ sĩ
- Diễn tả cảm xúc qua âm nhạc

## Conversation opener
*"What kind of music do you like?"*
*"Who is your favorite singer?"*
*"Have you ever been to a live concert?"*

## Quick brainstorm
- 5 thể loại âm nhạc bạn biết bằng tiếng Anh
- 3 nhạc cụ bạn có thể chơi hoặc muốn học
- 1 bài hát tiếng Anh yêu thích của bạn`,
      },
      {
        title: "Vocabulary — Music genres & instruments",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 3 — Vocabulary: Music

## 🎵 Music genres (Thể loại nhạc)

| English        | Vietnamese            |
|----------------|-----------------------|
| pop            | nhạc pop              |
| rock           | nhạc rock             |
| classical      | nhạc cổ điển          |
| jazz           | nhạc jazz             |
| hip-hop / rap  | nhạc hip-hop / rap    |
| country        | nhạc đồng quê         |
| folk           | nhạc dân gian         |
| electronic     | nhạc điện tử          |

## 🎸 Musical instruments

| English        | Vietnamese            |
|----------------|-----------------------|
| guitar         | đàn guitar            |
| piano          | đàn piano             |
| violin         | đàn violin            |
| drums          | trống                 |
| flute          | sáo                   |
| saxophone      | kèn saxophone         |

## 🎤 People in music
- **singer** — ca sĩ
- **musician** — nhạc sĩ
- **composer** — nhà soạn nhạc
- **band** — ban nhạc
- **audience** /ˈɔːdiəns/ — khán giả

## ✍️ Useful expressions
> *"I'm into pop music."* — Tôi thích nhạc pop
> *"My favorite band is..."* — Ban nhạc yêu thích của tôi là...
> *"He plays the guitar very well."* — Anh ấy chơi guitar rất giỏi`,
        quiz: [
          {
            question: "Người chơi nhạc cụ tiếng Anh là gì?",
            options: ["singer", "musician", "audience", "composer"],
            correctIndex: 1,
          },
          {
            question: "'Đàn violin' tiếng Anh:",
            options: ["guitar", "violin", "flute", "piano"],
            correctIndex: 1,
          },
          {
            question: "'I play ___ guitar.' — chọn mạo từ đúng",
            options: ["a", "an", "the", "không cần"],
            correctIndex: 2,
          },
          {
            question: "Which is NOT a music genre?",
            options: ["pop", "rock", "drums", "jazz"],
            correctIndex: 2,
          },
        ],
      },
      {
        title: "Grammar — To-infinitive & gerunds",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 3 — Grammar: To-infinitive & Gerunds

## 1. To-infinitive (to + V)
Dùng sau các động từ: **want, need, decide, hope, plan, learn, try, agree, refuse**.

> *"I **want to learn** the guitar."*
> *"She **decided to join** the choir."*

## 2. Gerund (V-ing)
Dùng sau các động từ: **enjoy, like, love, hate, finish, stop, mind, suggest, avoid**.

> *"I **enjoy listening** to music."*
> *"He **finished practicing** the piano."*

## 3. Cả hai đều OK
Một số động từ chấp nhận cả 2: **like, love, hate, prefer, start, begin, continue**.

> *"I like **playing** football."* = *"I like **to play** football."*

## ⚠️ Khác nghĩa
- *stop **to do** sth* — dừng để làm gì
- *stop **doing** sth* — ngừng làm gì

> *"He stopped **smoking**."* — Anh ấy bỏ thuốc lá.
> *"He stopped **to smoke**."* — Anh ấy dừng lại để hút thuốc.

## ✍️ Trong context âm nhạc
> *"I love **listening to** classical music."* (gerund)
> *"She wants **to become** a famous singer."* (to-infinitive)`,
        quiz: [
          {
            question: "Choose the correct form: 'I enjoy ___ music.'",
            options: ["listen", "to listen", "listening", "listened"],
            correctIndex: 2,
          },
          {
            question: "'I want ___ the guitar.'",
            options: ["play", "to play", "playing", "played"],
            correctIndex: 1,
          },
          {
            question: "Sau động từ 'decide' là gì?",
            options: ["V-ing", "to V", "V (nguyên thể)", "Both V-ing và to V"],
            correctIndex: 1,
          },
          {
            question: "'She finished ___ the piano lesson.'",
            options: ["practice", "to practice", "practicing", "practiced"],
            correctIndex: 2,
          },
        ],
      },
      {
        title: "Reading — A music festival",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 3 — Reading: A Music Festival

## Đoạn văn
*The Glastonbury Festival is one of the most famous music festivals in the world. It takes place every June in England and attracts over 200,000 people each year. Music fans love attending because they can listen to many different genres — from rock to electronic, and from folk to pop.*

*The festival lasts five days. People camp in tents and enjoy music from morning until late at night. Famous artists like Adele, Coldplay, and Beyoncé have performed there. The festival also supports many charity organizations, donating millions of pounds each year.*

*If you ever have the chance to attend, remember to bring warm clothes — English weather can be unpredictable!*

## Comprehension
1. Where does Glastonbury Festival take place?
2. How long does the festival last?
3. Name two artists who have performed there.
4. Why should you bring warm clothes?

## Vocabulary
- **festival** /ˈfestɪvl/ — lễ hội
- **attract** /əˈtrækt/ — thu hút
- **attend** /əˈtend/ — tham dự
- **camp** /kæmp/ — cắm trại
- **charity** /ˈtʃærəti/ — từ thiện
- **donate** /dəʊˈneɪt/ — quyên góp`,
      },
      {
        title: "Listening + Music project",
        videoUrl: PLACEHOLDER_VIDEO,
        content: `# Unit 3 — Listening + Project

## 🎧 Listening
Nghe đoạn phỏng vấn với một ca sĩ trẻ về hành trình âm nhạc của họ.

## 📋 Music Project — "My Music Journey"
**Yêu cầu:** Tạo bài thuyết trình ngắn (3-5 phút) tiếng Anh về:
- Ban nhạc/ca sĩ yêu thích của bạn
- Thể loại nhạc và lý do bạn yêu thích
- Một bài hát có ý nghĩa với bạn

## Useful phrases for presentation
- *"My favorite musician is..."*
- *"I started liking this kind of music when..."*
- *"The lyrics remind me of..."*
- *"What I love about this song is..."*

## Đánh giá
- **Content (40%):** Đầy đủ thông tin, có cảm xúc cá nhân
- **Language (30%):** Đúng ngữ pháp, từ vựng phong phú
- **Pronunciation (20%):** Phát âm rõ, đúng trọng âm
- **Delivery (10%):** Tự tin, có giao tiếp ánh mắt`,
        quiz: [
          {
            question: "'Lyrics' nghĩa là gì?",
            options: ["Giai điệu", "Lời bài hát", "Nhịp điệu", "Hợp âm"],
            correctIndex: 1,
          },
          {
            question: "Khi thuyết trình, phrase nào phù hợp nhất để mở đầu?",
            options: [
              "Hello, my favorite musician is...",
              "OK so I like...",
              "Listen carefully...",
              "Don't interrupt me...",
            ],
            correctIndex: 0,
          },
          {
            question: "'What I love about this song is...' là cách:",
            options: [
              "Đặt câu hỏi",
              "Bày tỏ ý kiến cá nhân",
              "Mô tả khách quan",
              "Phản đối",
            ],
            correctIndex: 1,
          },
        ],
      },
    ],
  },
];
