# CodeBoost

CodeBoost is a web application that allows users to paste code and perform various actions such as adding comments, writing tests, and refactoring the code. The application uses the OpenAI API to process the code and provides a modern, user-friendly interface built with Tailwind CSS.

## Features

- Paste code into a text area for processing.
- Perform actions like adding comments, writing tests, and refactoring code.
- Highlighted code output using Prism.js.
- Copy code to clipboard and clear the input/output.
- Responsive design with Tailwind CSS.
- Loader animation while processing code.

## Technologies Used

- HTML
- Tailwind CSS
- JavaScript
- Node.js
- Express
- OpenAI API
- Prism.js
- Font Awesome

## Getting Started

### Prerequisites

- Node.js and npm installed
- OpenAI API key

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/Sadoge/codeboost.git
   cd codeboost
   ```

2. Install the dependencies:

   ```sh
   npm install
   ```

3. Create a `.env` file in the root directory and add your OpenAI API key:

   ```env
   OPENAI_API_KEY=your_openai_api_key
   ```

### Running the Application

1. Start the server:

   ```sh
   node server.js
   ```

2. Open your web browser and navigate to `http://localhost:3000`.

## File Structure

```
project_root/
├── public/
│   ├── index.html
│   ├── styles.css
│   ├── script.js
│   ├── prism.css
│   └── prism.js
├── server.js
└── .env
```

## Usage

1. Paste your code into the text area.
2. Click on one of the action buttons:
   - **Add Comments**: Adds comments to the code.
   - **Write Tests**: Writes tests for the code.
   - **Refactor Code**: Refactors the code for better readability and efficiency.
3. The processed code will be displayed below the buttons.
4. Use the **Copy** button to copy the code to the clipboard.
5. Use the **Clear** button to clear the input and output.

## Customization

- You can customize the styles by editing the `styles.css` file.
- Modify the HTML structure in `index.html` as needed.
- Update the backend logic in `server.js` to add more functionalities or improve existing ones.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgements

- [OpenAI](https://www.openai.com/) for their powerful API.
- [Tailwind CSS](https://tailwindcss.com/) for the modern design framework.
- [Prism.js](https://prismjs.com/) for code syntax highlighting.
- [Font Awesome](https://fontawesome.com/) for the icons.

---

