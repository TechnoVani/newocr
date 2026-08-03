// src/components/Footer.jsx
const Footer = () => {
  return (
    <footer className="mt-auto flex w-full shrink-0 flex-col items-center justify-between gap-2 border-t border-gray-200/50 bg-white/30 px-4 py-4 text-xs font-medium text-gray-500 backdrop-blur-md sm:flex-row sm:gap-0 sm:px-8">
      <div className="text-center sm:text-left">
        All rights reserved in Notion Insurance &copy; 2026
      </div>
      <div className="text-center sm:text-right">
        Developed by{" "}
        <a
          href="https://www.technovani.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-gray-700 hover:text-blue-600 transition-colors duration-200"
        >
          Technovani Pvt. Ltd.
        </a>
      </div>
    </footer>
  );
};

export default Footer;