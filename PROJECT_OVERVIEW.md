# Project Overview

## Project Structure and Core Functionality

This report details the architecture, functionality, and user experience of the web application.

**1. Frontend Architecture**

*   **Framework/Tooling:** React with Vite for bundling and development server.
*   **Authentication:** Clerk.js is used for user authentication.
*   **Real-time Communication:** Socket.IO client for WebSocket communication with the backend.
*   **Styling:** TailwindCSS is used for utility-first CSS styling. Additional custom CSS is present in `App.css`, `index.css`, and component-specific modules like `MicVisualizer.module.css`.
*   **Key Components:**
    *   `App.tsx`: Sets up routing for the application using `react-router-dom`. Routes include `/` (Landing), `/omegle` (main chat interface), `/caught` (likely an error or specific state page), `/loading`, `/about`, and `/how-it-works`.
    *   `Omegle.tsx`: This component handles the pre-chat user experience.
        *   It ensures the user is signed in via Clerk and verifies that the primary email address ends with `.rishihood.edu.in`. If not, the user is signed out and redirected.
        *   It allows the user to input their name.
        *   It lists available audio input devices and allows the user to select a microphone.
        *   It includes a `MicVisualizer` component.
        *   It captures local audio and video streams using `navigator.mediaDevices.getUserMedia`.
        *   Upon clicking "Join Chat", it transitions to the `Room` component.
        *   It features a `LightPullThemeSwitcher` for changing the visual theme and a `UserButton` from Clerk for user management.
    *   `Room.tsx`: This component manages the active chat session.
        *   It establishes a Socket.IO connection to the backend.
        *   It handles the WebRTC peer connection setup (sending and receiving offers, answers, and ICE candidates).
        *   It displays local and remote video streams.
        *   It includes a text chat interface.
        *   It provides "Next" and "Exit" buttons for chat control.
        *   It implements an "auto-next" feature that triggers the "next" functionality if the user is waiting in the lobby for too long (currently 3 seconds).
    *   `Landing.tsx`, `About.tsx`, `HowItWorks.tsx`: Static content pages.
    *   UI elements from `shadcn/ui` are used, as seen in `Toaster`, `ToastAction` etc.

**2. Backend Architecture**

*   **Framework/Runtime:** Node.js with Express.js.
*   **Language:** TypeScript.
*   **Real-time Communication:** Socket.IO server for WebSocket communication with clients.
*   **Core Files:**
    *   `index.ts`: Initializes the Express server and Socket.IO instance. It configures CORS for the frontend URL (retrieved from `process.env.FRONTEND_URL`). It instantiates `UserManager` and handles new Socket.IO connections by adding users via `UserManager`.
    *   `UserManger.ts` (Note: filename has a typo - "UserManger" instead of "UserManager"):
        *   Manages a list of connected users (`User` interface: `socket`, `name`).
        *   Maintains a `queue` of socket IDs waiting to be matched.
        *   When a new user connects, they are added to the users list and their socket ID to the queue. The client is emitted a "lobby" event.
        *   `clearQueue()`: If there are two or more users in the queue, it pops two users, finds their `User` objects, and calls `roomManager.createRoom()` to pair them.
        *   `initHandlers()`: Sets up event listeners for each connected socket:
            *   `offer`, `answer`, `add-ice-candidate`: Relays WebRTC signaling messages to `RoomManager`.
            *   `next-user`: Handles a user's request to find a new chat partner. It disconnects the current room, informs the other user, and attempts to re-queue both users.
            *   `chat-message`: Relays text messages to `RoomManager`.
        *   `removeUser()`: Handles user disconnection, informing `RoomManager` to clean up any active room.
    *   `RoomManager.ts`:
        *   Manages active chat rooms. A room consists of two `User` objects.
        *   `createRoom()`: Creates a new room, assigns a unique `roomId`, stores the room, and maps user socket IDs to the `roomId`. It then emits `send-offer` to both users in the room to initiate WebRTC negotiation.
        *   `handleDisconnection()`: Cleans up a room when a user disconnects, notifying the other user.
        *   `onOffer()`, `onAnswer()`, `onIceCandidates()`: Forwards WebRTC signaling messages (SDP offers/answers, ICE candidates) between the two users in a specific room.
        *   `sendMessage()`: Forwards chat messages to the other user in the room.

**3. WebRTC Implementation**

*   **Signaling:** The backend Socket.IO server acts as the signaling server.
    *   When `RoomManager.createRoom()` is called, both clients are sent a `send-offer` event with a `roomId`.
    *   The client (`Room.tsx`) that receives `send-offer` (or based on internal logic as both receive it) will create an RTCPeerConnection, add local media tracks, create an offer, set local description, and send this offer to the server via a Socket.IO "offer" event.
    *   The server, via `RoomManager.onOffer()`, relays this SDP offer to the other client in the room.
    *   The second client receives the offer, creates its RTCPeerConnection, sets the remote description (the received offer), creates an answer, sets its local description, and sends this answer back to the server via a Socket.IO "answer" event.
    *   The server, via `RoomManager.onAnswer()`, relays this SDP answer to the first client.
    *   The first client receives the answer and sets it as its remote description.
*   **ICE Candidates:**
    *   Both clients, after setting up their RTCPeerConnections, will generate ICE candidates.
    *   These candidates are sent to the server via the "add-ice-candidate" Socket.IO event, including the `roomId` and type.
    *   The server, via `RoomManager.onIceCandidates()`, relays these ICE candidates to the other client in the room.
    *   Clients add received ICE candidates to their respective RTCPeerConnection instances.
*   **STUN/TURN Servers:**
    *   The frontend `Room.tsx` component configures `RTCPeerConnection` with a list of STUN servers (e.g., `stun:stun.l.google.com:19302`) and TURN servers (`turn:relay.metered.ca:80` and `turn:relay.metered.ca:443` with "openai" credentials). This aids in NAT traversal.

**4. User Experience Flow**

1.  **Landing:** User arrives at the site's landing page (`/`).
2.  **Authentication:** User signs in/up using Clerk.
3.  **Domain & Name Entry:**
    *   After successful authentication, the user is redirected to `/omegle`.
    *   The system checks if the user's email ends with `.rishihood.edu.in`. If not, the user is signed out and redirected to the landing page.
    *   The user is prompted to enter their name.
4.  **Microphone Selection:**
    *   The UI displays a list of available microphones.
    *   The user can select their preferred microphone. A microphone visualizer provides feedback.
    *   The user's camera preview is shown.
5.  **Joining Chat:**
    *   User clicks "Join Chat".
    *   The `Room` component is rendered. A Socket.IO connection is made to the backend.
    *   The backend's `UserManager` adds the user to a queue and emits a "lobby" event.
6.  **Waiting & Matching:**
    *   While in the lobby (waiting for a partner), an "auto-next" feature in `Room.tsx` triggers every 3 seconds, effectively re-requesting a match by calling `handleNext()` which emits "next-user".
    *   Once the backend `UserManager` finds two users in the queue, `RoomManager` creates a room.
7.  **WebRTC Connection & Chat:**
    *   Signaling (offers, answers, ICE candidates) occurs via Socket.IO as described above.
    *   Once the WebRTC connection is established, video and audio streams are exchanged. Local video is mirrored. Remote video is displayed. Usernames are shown overlayed on videos.
    *   Users can communicate via text chat. Messages are timestamped and show the sender's name.
8.  **"Next" Functionality:**
    *   User clicks the "Next" button.
    *   The client emits a "next-user" event.
    *   The backend's `UserManager` and `RoomManager` handle disconnecting the current room. Both users involved are notified and put back into the lobby/queue.
9.  **"Exit" Functionality:**
    *   User clicks the "Exit" button.
    *   The client calls `handleExit()`, which disconnects the Socket.IO connection and calls the `onExit` prop, taking the user back to the `Omegle.tsx` name/mic selection screen.
    *   The backend handles the socket disconnection, removing the user and cleaning up any room they were in.
10. **Disconnections:**
    *   If a user disconnects (e.g., closes tab), the backend `socket.on("disconnect")` fires.
    *   `UserManager.removeUser()` calls `RoomManager.handleDisconnection()`.
    *   The `RoomManager` notifies the other user in the room by emitting a "user-disconnected" event.
    *   The frontend `Room.tsx`, upon receiving "user-disconnected", calls `handleNext()` to find a new partner.

**5. Key Features**

*   **Email Domain Restriction:** Access is limited to users with a `@rishihood.edu.in` email address, enforced on the frontend after Clerk authentication.
*   **Microphone Selection UI:** Users can choose their microphone from a list of available devices before joining a chat, with a visualizer.
*   **"Auto-Next" in Lobby:** If a user is in the "lobby" state (waiting for a partner) in `Room.tsx`, the "next" function is automatically called every 3 seconds to try and find a match.
*   **Visual Theme Switcher:** A `LightPullThemeSwitcher` component (visible in `Omegle.tsx`) allows users to change the site's visual theme (likely light/dark mode).
*   **Real-time Text Chat:** Alongside video/audio, users can exchange text messages.
*   **STUN/TURN Integration:** Uses Google STUN servers and Metered.ca TURN servers for robust WebRTC NAT traversal.
*   **Clear User Interface:** Separate views for pre-chat setup (`Omegle.tsx`) and the active chat (`Room.tsx`), with distinct video feeds for local and remote users.

## Key Files and Their Roles

*   **`backend/src/index.ts`**:
    *   **Role:** Main entry point for the backend application.
    *   **Description:** Initializes the Express server, sets up the Socket.IO server with CORS configuration, and handles basic Socket.IO connection events by delegating to `UserManager`. It listens for incoming connections and starts the HTTP server.

*   **`backend/src/managers/UserManger.ts`** (Actual filename: `UserManger.ts` - note the typo)
    *   **Role:** Manages user connections, queueing for chat, and matchmaking.
    *   **Description:** Handles new user connections, adds them to a queue, and pairs users from the queue to create chat rooms via `RoomManager`. It also manages Socket.IO event handlers for WebRTC signaling (`offer`, `answer`, `add-ice-candidate`), user actions (`next-user`, `chat-message`), and disconnections.

*   **`backend/src/managers/RoomManager.ts`**:
    *   **Role:** Manages active chat rooms and facilitates WebRTC signaling between paired users.
    *   **Description:** Creates and deletes chat rooms for pairs of users. It relays WebRTC signaling messages (SDP offers/answers, ICE candidates) and chat messages between the two users in a room. It also handles cleanup when a user in a room disconnects.

*   **`frontend/src/main.tsx`**:
    *   **Role:** Main entry point for the React frontend application.
    *   **Description:** Renders the root React component (`App.tsx`) into the DOM. It often includes setup for context providers or other global configurations. It also imports necessary CSS files and configures Clerk authentication.

*   **`frontend/src/App.tsx`**:
    *   **Role:** Root component of the React application that defines the main structure and routing.
    *   **Description:** Sets up client-side routing using `react-router-dom` to define different views/pages of the application (e.g., Landing, Omegle, About).

*   **`frontend/src/components/Omegle.tsx`**:
    *   **Role:** Component responsible for the pre-chat user interface and setup.
    *   **Description:** Handles user authentication (via Clerk), enforces the email domain restriction (`.rishihood.edu.in`), allows users to input their name, select a microphone, and see their camera preview. It initiates the process of joining a chat room by rendering the `Room` component.

*   **`frontend/src/components/Room.tsx`**:
    *   **Role:** Component managing the live video/audio chat experience.
    *   **Description:** Establishes and manages the Socket.IO connection for real-time communication with the backend. It handles all WebRTC peer connection logic (creating offers/answers, exchanging ICE candidates, managing media tracks). It displays local and remote video, provides text chat functionality, and includes "Next" and "Exit" controls. It also implements an "auto-next" feature for users waiting in the lobby.

*   **`frontend/index.html`**:
    *   **Role:** The main HTML file for the frontend application.
    *   **Description:** Serves as the entry point for the browser. Vite injects the bundled JavaScript and CSS into this file. It contains the root DOM element where the React application is mounted.

*   **`frontend/package.json`**:
    *   **Role:** Defines frontend project metadata, dependencies, and scripts.
    *   **Description:** Lists all JavaScript libraries and tools required for the frontend (e.g., React, Socket.IO client, TailwindCSS, Vite). It also contains scripts for development (`dev`), building (`build`), linting (`lint`), etc.

*   **`backend/package.json`**:
    *   **Role:** Defines backend project metadata, dependencies, and scripts.
    *   **Description:** Lists all JavaScript libraries and tools required for the backend (e.g., Express, Socket.IO, TypeScript). It also contains scripts for building the TypeScript code (`build`), starting the server (`start`), and running in development mode (`dev`).
