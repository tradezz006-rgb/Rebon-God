import { StudentLesson } from '../../types/database';

export const studentLessonsSeed: StudentLesson[] = [
  {
    id: "SL_001_p1",
    title: "Internet Basics (Client-Server) - Part 1",
    concept_explanation: {
      what_is_this: "The internet is a massive global network of computers. At its core, it relies on a 'Client-Server' model. The client is your browser or device requesting information, and the server is a powerful computer somewhere else that serves that information back to you.",
      how_we_use_it: "Whenever you type a URL or click a link, your browser acts as the client. It sends a specific request across the network to a designated server, which then processes it and sends back the webpage data.",
      where_we_use_it: "We use this concept everywhere on the web: loading a Youtube video, sending a WhatsApp message, or fetching data in an app. It is the fundamental architecture of the internet.",
      where_not_to_use_it: "You wouldn't use a client-server model for local offline computing, like playing a single-player game on your PC that doesn't need to save data online or fetch updates.",
      impact: "Understanding this allows you to build applications that scale globally. It separates the 'presentation' (what the user sees) from the 'business logic and data' (what happens securely on the server)."
    },
    key_points: [
      "Client requests data, Server responds with data.",
      "The web is stateless; every request must contain all necessary information.",
      "Servers must be highly available and secure."
    ],
    whiteboard_content: [
      "[Drawing: Laptop (Client)] --> [Arrow: Request] --> [Drawing: Server Rack]",
      "[Drawing: Server Rack] --> [Arrow: Response (HTML/JSON)] --> [Drawing: Laptop]"
    ],
    interaction_questions: [
      "If you are watching this video right now, is your device acting as the client or the server?"
    ],
    expected_answers: [
      "Client", "my device is the client", "i am the client"
    ],
    validation_logic: [
      "client", "my device"
    ],
    correct_response: "Exactly right! Your device requested this video from our servers, making it the client.",
    wrong_response: "Not quite. Remember, the device asking for the data is the client. The computer sending the video is the server.",
    real_world_example: "Imagine ordering at a restaurant. You are the client asking for food. The kitchen is the server preparing and returning your meal.",
    quizzes: [
      {
        quiz_id: "Q_SL_001_p1_1",
        title: "Client-Server Reality Check",
        questions: [
          {
            question_id: "q1",
            question_text: "What primarily differentiates a client from a server in the standard internet model?",
            options: [
              "Clients only use Wi-Fi, while servers use ethernet.",
              "Clients initiate requests for resources, while servers listen for and fulfill those requests.",
              "Servers always have screens, clients do not.",
              "Clients and servers are identical and perform the same tasks simultaneously."
            ],
            correct_answer: "Clients initiate requests for resources, while servers listen for and fulfill those requests.",
            explanation: "The core defining trait of the client-server architecture is the request-response cycle initiated by the client."
          }
        ]
      }
    ],
    linked_scenario_ids: [
      "PS_001_beg"
    ],
    duration_estimate: 12,
    difficulty_level: "Beginner",
    part_number: 1
  },
  {
    id: "SL_002_p1",
    title: "HTTP & APIs - Part 1",
    concept_explanation: {
      what_is_this: "HTTP stands for Hypertext Transfer Protocol. It's the language clients and servers use to speak to each other. An API, or Application Programming Interface, is a set of rules that lets different software programs communicate over HTTP using structured data.",
      how_we_use_it: "We use HTTP verbs like GET to retrieve data, POST to send new data, and DELETE to remove data. We use APIs to ask a server, 'Hey, give me the weather for Mumbai,' using a GET request.",
      where_we_use_it: "APIs are used everywhere: a weather app fetching live data, a login screen checking your password, or a payment gateway processing your credit card.",
      where_not_to_use_it: "You wouldn't use a web API to communicate between two hardware components on the same motherboard. Web APIs are strictly for distributed systems over a network.",
      impact: "APIs allow different systems, written in completely different languages (like a Swift iOS app and a Python backend), to communicate seamlessly using universal JSON data."
    },
    key_points: [
      "HTTP is the protocol, API is the interface.",
      "GET is for reading, POST is for creating.",
      "APIs usually return data in JSON format."
    ],
    whiteboard_content: [
      "GET /users/123 -> HTTP 200 OK -> { name: 'Rahul' }",
      "POST /login -> { user, pass } -> HTTP 201 Created -> { token }"
    ],
    interaction_questions: [
      "If I want to create a new user account, which HTTP method should I use: GET or POST?"
    ],
    expected_answers: [
      "POST", "I would use POST"
    ],
    validation_logic: [
      "post"
    ],
    correct_response: "Spot on! We use POST to send data to the server to create something new.",
    wrong_response: "Actually, we would use POST. We use GET only when we want to read or retrieve data.",
    real_world_example: "An API is like a waiter. You (the client) look at the menu and tell the waiter your order. The waiter takes it to the kitchen (server) and brings back your food (data).",
    quizzes: [
      {
        quiz_id: "Q_SL_002_p1_1",
        title: "API Fundamentals",
        questions: [
          {
            question_id: "q1",
            question_text: "Which statement best describes JSON in the context of APIs?",
            options: [
              "A programming language used to build servers.",
              "A security protocol that encrypts passwords over HTTP.",
              "A lightweight format for storing and transporting data, easily readable by humans and machines.",
              "A type of database used exclusively for web applications."
            ],
            correct_answer: "A lightweight format for storing and transporting data, easily readable by humans and machines.",
            explanation: "JSON (JavaScript Object Notation) has become the standard data interchange format for modern APIs due to its simplicity."
          }
        ]
      }
    ],
    linked_scenario_ids: [
      "PS_002_mod"
    ],
    duration_estimate: 14,
    difficulty_level: "Moderate",
    part_number: 1
  }
];
