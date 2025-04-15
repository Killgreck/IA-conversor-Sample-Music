# Firebase Studio

This is a NextJS starter in Firebase Studio.
This project is a Next.js application integrated with Firebase, designed for [briefly describe the application's core function, e.g., voice conversion using AI].  It utilizes a Python-based AI model for [specific AI task] and offers both a backend and frontend with distinct features.

## Features

### Backend

The backend handles the core logic of the application, including:

*   **AI Model Integration:**  Interfaces with a Python-based AI model (likely `so-vits-svc`) for [specific AI task, e.g., voice conversion].
*   **Audio Processing:**  Handles audio file uploads, processing, and manipulation using libraries like [mention libraries like ffmpeg, torchaudio, if used].
*   **Task Management:**  Manages the execution and status of AI processing tasks, potentially using queues or job systems.
*   **Firebase Integration:**  Utilizes Firebase for [mention specific Firebase services used, e.g., authentication, database, storage].
*   **API Endpoints:** Provides API endpoints for the frontend to interact with the backend functionality.

### Frontend

The frontend provides a user interface for interacting with the application's features:

*   **User Authentication:**  Allows users to create accounts and log in using Firebase authentication.
*   **File Upload:** Enables users to upload audio files for processing.
*   **Task Submission:**  Allows users to submit processing tasks to the backend, selecting options and parameters as needed.
*   **Task Monitoring:**  Provides a way for users to monitor the progress and status of their submitted tasks.
*   **Result Download:**  Allows users to download the processed audio files once the tasks are completed.
*   **User Interface:** Presents a clean and intuitive user interface, potentially using a component library like [mention used component library if applicable, e.g., Material UI, Chakra UI].

## Running the Application in Visual Studio Code for Testing

Follow these step-by-step instructions to run the application locally in Visual Studio Code for development and testing:

1.  **Prerequisites:** Ensure you have the following software installed:
    *   **Node.js:**  Download and install the latest LTS version from [https://nodejs.org/](https://nodejs.org/).
    *   **npm (or yarn):**  npm usually comes bundled with Node.js.  If not, or if you prefer yarn, install it separately.
    *   **Python:** You will need Python 3.7 or higher to run the AI model components.  Install it from [https://www.python.org/](https://www.python.org/).  Ensure that `python` and `pip` are added to your system's PATH environment variable.
    *   **Visual Studio Code:**  Download and install it from [https://code.visualstudio.com/](https://code.visualstudio.com/).
    *   **Git:**  Install Git from [https://git-scm.com/](https://git-scm.com/).
2.  **Clone the Repository:**  Open Visual Studio Code, and use the "Clone Repository" option (Ctrl+Shift+P or Cmd+Shift+P, then type "Git: Clone") to clone the project's Git repository to your local machine.
3.  **Install Dependencies:**  Open the cloned project in VS Code. Open a new terminal (Ctrl+\` or Cmd+\`). Navigate to the project directory and run `npm install` to install the required Node.js packages. Then, you will need to install the Python dependencies for your AI model. This typically involves navigating to the directory containing the AI model code and using `pip install -r requirements.txt` (if a `requirements.txt` file exists) or installing the dependencies individually based on the model's documentation (most likely `torch`, `torchaudio`, and potentially others).
4.  **Configure Firebase:**  You will need to set up a Firebase project and configure the necessary credentials (e.g., `firebaseConfig` object) within your application, typically in a file like `firebase.ts` or similar. Refer to the Firebase documentation for instructions on creating a project and obtaining the configuration details.
5.  **Run the Development Server:**  In the VS Code terminal, run `npm run dev`. This will start the Next.js development server, usually accessible at `http://localhost:3000` in your web browser.  The server will watch for file changes and automatically recompile the code as you make modifications.  Keep this terminal open while you're testing.
6.  **Test the Application:** Open your web browser and navigate to `http://localhost:3000`. You should now be able to interact with the application and test its features.  Since the AI components may run as separate processes, ensure they are also running or will be started by the Next.js server (check the `src/services/voice-conversion.ts` file and any related code that uses `child_process.spawn`).  If the AI components have separate run commands, you may need to run them in separate terminals.
7.  **Debugging:**  VS Code offers excellent debugging capabilities.  You can set breakpoints in your JavaScript/TypeScript code, and also potentially debug the Python components if you configure a Python debugger in VS Code.  Refer to the VS Code documentation for debugging instructions.  To debug the Next.js application, you can use the "Run and Debug" view (Ctrl+Shift+D or Cmd+Shift+D) and select a configuration (if one exists, or create a new one for Node.js debugging).
