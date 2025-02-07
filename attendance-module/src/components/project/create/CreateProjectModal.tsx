import { useState } from "react";
import toast from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { CreateProjectData } from "../../../types";
import ProjectDetailsSection from "./DetailsSection";
import ResponsiveDialog from "../../ResponsiveDialog";

import { Button } from "@mui/joy";
import dayjs from "dayjs";

// Define the interface for the error response data
interface ErrorResponseData {
  message: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const CreateProjectModal = ({ isOpen, setIsOpen }: CreateProjectModalProps) => {
  const [projectDetails, setProjectDetails] = useState<CreateProjectData>({
    name: null,
    clientUEN: null,
    clientName: null,
    employmentBy: null,
    startDate: null,
    endDate: null,
    noticePeriodDuration: null,
    noticePeriodUnit: null,
  });

  const navigate = useNavigate();

  const handleSaveProject = async () => {
    const body = {
      ...projectDetails,
      timezone: dayjs.tz.guess(),
    };

    try {
      const { status, data } = await axios.post("/api/admin/project", body);
      if (status === 200) {
        navigate(`/admin/project/${data.projectCuid}`);
        return toast.success(data.message);
      }

      toast.error(data.message);
    } catch (error) {
      const axiosError = error as AxiosError<ErrorResponseData>;
      toast.error(
        axiosError.response?.data.message ||
          "Error while creating project. Please try again later."
      );
    }
  };

  return (
    <ResponsiveDialog
      open={isOpen}
      title="Create Project"
      handleClose={() => setIsOpen(false)}
      actions={
        <Button size="sm" variant="solid" onClick={handleSaveProject}>
          Create Project
        </Button>
      }
    >
      <ProjectDetailsSection
        projectDetails={projectDetails}
        setProjectDetails={setProjectDetails}
      />
    </ResponsiveDialog>
  );
};

export default CreateProjectModal;
