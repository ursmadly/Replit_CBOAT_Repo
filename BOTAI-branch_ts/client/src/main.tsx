import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// FontAwesome icons
import { library } from '@fortawesome/fontawesome-svg-core';
import { 
  faSearch, faUserCircle, faBell, faQuestionCircle, 
  faCog, faClipboardList, faCalendar, faChartLine,
  faExclamationTriangle, faShieldAlt, faCheckCircle,
  faPlus, faDownload, faFilter, faHourglass, faTasks,
  faBuilding, faEllipsisH, faChevronLeft, faChevronRight,
  faHome, faUser, faCloudUploadAlt, faTimes, faExclamationCircle,
  faInfoCircle, faExclamation, faCaretDown
} from '@fortawesome/free-solid-svg-icons';

// Add icons to library
library.add(
  faSearch, faUserCircle, faBell, faQuestionCircle, 
  faCog, faClipboardList, faCalendar, faChartLine,
  faExclamationTriangle, faShieldAlt, faCheckCircle,
  faPlus, faDownload, faFilter, faHourglass, faTasks,
  faBuilding, faEllipsisH, faChevronLeft, faChevronRight,
  faHome, faUser, faCloudUploadAlt, faTimes, faExclamationCircle,
  faInfoCircle, faExclamation, faCaretDown
);

createRoot(document.getElementById("root")!).render(<App />);
