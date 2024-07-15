import axios from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { CommonCandidate } from "../../../types/common";
import { useProjectContext } from "../../../providers/projectContextProvider";

import AddCandidateModal from "./AddCandidateModal";
import AssignCandidateModal from "./AssignCandidateModal";
import DeleteCandidateModal from "./DeleteCandidateModal";
import SmallScreenDivider from "../ui/SmallScreenDivider";
import CandidateTable from "./CandidateTable";

import {
  Box,
  Input,
  FormControl,
  FormLabel,
  Stack,
  Tooltip,
  IconButton,
  Dropdown,
  MenuButton,
  Menu,
  MenuItem,
  Typography,
} from "@mui/joy";
import {
  AddRounded as AddIcon,
  ArrowDropDownRounded as ArrowDropDownIcon,
  SearchRounded as SearchIcon,
} from "@mui/icons-material";

const AdminProjectCandidatesPage = () => {
  const { project, updateProject } = useProjectContext();

  const candidatesData =
    project?.candidates?.map((cdd) => {
      return {
        cuid: cdd.cuid,
        nric: cdd.nric,
        name: cdd.name,
        contact: cdd.contact,
        residency: cdd.residency,
        dateOfBirth: cdd.dateOfBirth,
        createdAt: cdd.createdAt,
        startDate: cdd.startDate,
        endDate: cdd.endDate,
        hasOnboarded: cdd.hasOnboarded,
        employmentType: cdd.employmentType,
        consultantCuid: cdd.consultantCuid,
        consultantName: project?.consultants.find(
          (c) => c.cuid === cdd.consultantCuid
        )!.name,
      };
    }) || [];

  const [searchValue, setSearchValue] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [candidatesToDelete, setCandidatesToDelete] = useState<string[]>([]);

  // TODO: Fix type
  const matchSearchValue = (c: CommonCandidate) =>
    c.nric.toLowerCase().includes(searchValue.toLowerCase()) ||
    c.name.toLowerCase().includes(searchValue.toLowerCase());

  const handleConfirmDeletion = async (cuidList: string[]) => {
    setCandidatesToDelete(cuidList);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCandidates = async () => {
    try {
      await axios.delete(`/api/admin/project/${project?.cuid}/candidates`, {
        data: { cuidList: candidatesToDelete },
      });
      updateProject();

      setIsDeleteModalOpen(false);
      toast.success("Candidate deleted");
    } catch (error) {
      setIsDeleteModalOpen(false);
      toast.error("Error while removing candidate");
    }
  };

  return (
    <Stack
      spacing={1}
      sx={{
        display: "flex",
        mx: "auto",
        px: { md: 4 },
      }}
    >
      <Box
        sx={{
          borderRadius: "sm",
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <FormControl sx={{ flex: 1 }} size="sm">
          <FormLabel>Search candidates</FormLabel>
          <Input
            size="sm"
            placeholder="Search by name/nric"
            startDecorator={<SearchIcon />}
            onChange={(e) => setSearchValue(e.target.value)}
            disabled={candidatesData.length === 0}
            fullWidth
          />
        </FormControl>

        <Dropdown>
          <MenuButton
            variant="solid"
            color="primary"
            size="sm"
            sx={{
              mt: "auto",
              display: { xs: "none", sm: "flex" },
              alignContent: "center",
              pr: 0.5,
            }}
          >
            Add candidates
            <ArrowDropDownIcon />
          </MenuButton>
          <Menu
            sx={{
              "& .MuiMenuItem-root": {
                display: "flex",
                justifyContent: "center",
              },
            }}
          >
            <MenuItem onClick={() => setAddModalOpen(true)}>
              <Typography level="body-xs">Individual</Typography>
            </MenuItem>
            <MenuItem onClick={() => setIsUploadOpen(true)}>
              <Typography level="body-xs">Bulk Upload</Typography>
            </MenuItem>
          </Menu>
        </Dropdown>

        <Tooltip title="Add a candidate" placement="top" size="sm">
          <IconButton
            size="sm"
            color="primary"
            variant="solid"
            onClick={() => setAddModalOpen(true)}
            sx={{ py: "auto", mt: "auto", display: { xs: "flex", sm: "none" } }}
          >
            <AddIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <SmallScreenDivider />

      <CandidateTable
        tableData={candidatesData.filter((c) => matchSearchValue(c))}
        handleDelete={handleConfirmDeletion}
        showCandidateHolder={true}
      />

      <AssignCandidateModal
        isUploadOpen={isUploadOpen}
        setIsUploadOpen={setIsUploadOpen}
      />

      <DeleteCandidateModal
        isDeleteModalOpen={isDeleteModalOpen}
        setIsDeleteModalOpen={setIsDeleteModalOpen}
        candidatesData={candidatesData}
        candidatesToDelete={candidatesToDelete}
        handleDeleteCandidates={handleDeleteCandidates}
      />

      <AddCandidateModal
        isAddModalOpen={isAddModalOpen}
        setAddModalOpen={setAddModalOpen}
      />
    </Stack>
  );
};

export default AdminProjectCandidatesPage;
