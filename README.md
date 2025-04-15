# Firebase Studio

This is a NextJS starter in Firebase Studio.
This project is a Next.js application integrated with Firebase, designed for voice conversion using AI. It utilizes a Python-based AI model for voice conversion (so-vits-svc) and offers both a backend and frontend with distinct features.

## Features

### Backend

The backend handles the core logic of the application, including:

*   **AI Model Integration:** Interfaces with a Python-based AI model (so-vits-svc) for voice conversion.
*   **Audio Processing:** Handles audio file uploads, processing, and manipulation using libraries like demucs, ffmpeg, and pydub.
*   **Task Management:** Manages the execution and status of AI processing tasks.
*   **Firebase Integration:** Utilizes Firebase for authentication, database, and storage.
*   **API Endpoints:** Provides API endpoints for the frontend to interact with the backend functionality.

### Frontend

The frontend provides a user interface for interacting with the application's features:

*   **User Authentication:** Allows users to create accounts and log in using Firebase authentication.
*   **File Upload:** Enables users to upload audio files for processing.
*   **Task Submission:** Allows users to submit processing tasks to the backend, selecting options and parameters as needed.
*   **Task Monitoring:** Provides a way for users to monitor the progress and status of their submitted tasks.
*   **Result Download:** Allows users to download the processed audio files once the tasks are completed.
*   **User Interface:** Presents a clean and intuitive user interface using Radix UI components.

## Running the Application in Visual Studio Code for Testing

Follow these step-by-step instructions to run the application locally in Visual Studio Code for development and testing:

1.  **Prerequisites:** Ensure you have the following software installed:
    *   **Node.js:** Download and install the latest LTS version from [https://nodejs.org/](https://nodejs.org/).
    *   **npm (or yarn):** npm usually comes bundled with Node.js. If not, or if you prefer yarn, install it separately.
    *   **Python:** You will need Python 3.7 or higher to run the AI model components. Install it from [https://www.python.org/](https://www.python.org/). Ensure that `python` and `pip` are added to your system's PATH environment variable.
    *   **Visual Studio Code:** Download and install it from [https://code.visualstudio.com/](https://code.visualstudio.com/).
    *   **Git:** Install Git from [https://git-scm.com/](https://git-scm.com/).
    *   **FFmpeg:** Install FFmpeg from [https://ffmpeg.org/](https://ffmpeg.org/) for audio processing.
2.  **Clone the Repository:** Open Visual Studio Code, and use the "Clone Repository" option (Ctrl+Shift+P or Cmd+Shift+P, then type "Git: Clone") to clone the project's Git repository to your local machine.
3.  **Install Dependencies:**
    *   **Python Dependencies:** In the terminal, run `pip install -r requirements.txt` to install the required Python packages.
    *   **Node.js Dependencies:** Run `npm install` to install the required Node.js packages.
    *   **so-vits-svc:** Clone the so-vits-svc repository by running `git clone https://github.com/svc-develop-team/so-vits-svc` in a suitable location. Follow the installation instructions in the so-vits-svc repository to set it up.
4.  **Configure Firebase:** You will need to set up a Firebase project and configure the necessary credentials (e.g., `firebaseConfig` object) within your application, typically in a file like `firebase.ts` or similar. Refer to the Firebase documentation for instructions on creating a project and obtaining the configuration details.
5.  **Run the Development Server:** In the VS Code terminal, run `npm run dev`. This will start the Next.js development server, usually accessible at `http://localhost:9002` in your web browser (as specified in package.json). The server will watch for file changes and automatically recompile the code as you make modifications. Keep this terminal open while you're testing.
6.  **Test the Application:** Open your web browser and navigate to `http://localhost:9002`. You should now be able to interact with the application and test its features.
7.  **Debugging:** VS Code offers excellent debugging capabilities. You can set breakpoints in your JavaScript/TypeScript code, and also potentially debug the Python components if you configure a Python debugger in VS Code. Refer to the VS Code documentation for debugging instructions.

## Project Structure

The project has been refactored to use Python scripts for AI-related tasks, with TypeScript code calling these scripts as needed:

- `scripts/separate_vocals.py`: Python script for separating vocals from a song using demucs.
- `scripts/train_model.py`: Python script for training a voice conversion model using so-vits-svc.
- `scripts/convert_voice.py`: Python script for converting vocals using a trained model.
- `scripts/merge_audio.py`: Python script for merging converted vocals with instrumental tracks.

The TypeScript services in `src/services/` call these Python scripts using child_process.spawn.
