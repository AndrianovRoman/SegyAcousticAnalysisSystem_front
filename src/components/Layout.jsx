import { Box } from "@mui/material";
import Sidebar from "./Sidebar";
import { Outlet } from "react-router-dom";
import ObjectFormModal from "./modals/ObjectFormModal";
import ElementFormModal from "./modals/ElementFormModal";
import PointFormModal from "./modals/PointFormModal";
import FileUploadModal from "./modals/FileUploadModal";
import ShareObjectModal from "./modals/ShareObjectModal";
import ProfileModal from "./modals/ProfileModal";
import ChangePasswordModal from "./modals/ChangePasswordModal";
import DeleteModal from "./modals/DeleteModal";
import Alerts from "./Alerts";

export default function Layout() {
    return (
        <Box display="flex">
            <Sidebar width="440px" />
            <Box flexGrow={1} p={3} style={{ paddingTop: "50px", paddingLeft: "490px" }}>
                <Outlet />
            </Box>
            <Alerts />
            <ObjectFormModal />
            <ElementFormModal />
            <PointFormModal />
            <FileUploadModal />
            <ShareObjectModal />
            <ProfileModal />
            <ChangePasswordModal />
            <DeleteModal />
        </Box>
    );
}