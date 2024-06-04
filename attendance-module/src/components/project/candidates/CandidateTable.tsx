import { getExactAge } from "../../../utils/date-time";
import { CommonCandidate, PermissionList } from "../../../types/common";
import { useUserContext } from "../../../providers/userContextProvider";

import {
  Box,
  Table,
  TableProps,
  Typography,
  Tooltip,
  IconButton,
} from "@mui/joy";
import { Delete } from "@mui/icons-material";

interface CandidateTableProps {
  tableTitle?: string;
  tableDescription?: string;
  tableProps: TableProps;
  tableData: (CommonCandidate & { consultantName: string })[];
  // handleEdit?: (nric: string) => void;
  handleDelete?: (nricList: string[]) => void;
  showCanidateHolder?: boolean;
}

const CandidateTable = ({
  tableTitle,
  tableDescription,
  tableProps,
  tableData,
  // handleEdit,
  handleDelete,
  showCanidateHolder = false,
}: CandidateTableProps) => {
  const showActions = handleDelete; // || handleEdit;
  const { user } = useUserContext();

  return (
    <Box>
      <Typography level="title-sm">{tableTitle}</Typography>
      <Typography level="body-xs">{tableDescription}</Typography>
      <Table sx={{ "& tr > *": { textAlign: "center" } }} {...tableProps}>
        <thead>
          <tr>
            <th>NRIC</th>
            <th>Full name</th>
            <th>Contact Number</th>
            <th>Date of birth</th>
            <th>Age</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Type</th>
            {showCanidateHolder && <th>Candidate Holder</th>}
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tableData.length === 0 ? (
            <tr>
              <td colSpan={showActions ? 10 : 9}>No candidates found.</td>
            </tr>
          ) : (
            tableData.map((row) => (
              <tr key={row.cuid}>
                <td>{row.nric}</td>
                <td>{row.name}</td>
                <td>{row.contact}</td>
                <td>{row.dateOfBirth ? row.dateOfBirth.slice(0, 10) : ""}</td>
                <td>
                  {row.dateOfBirth
                    ? getExactAge(row.dateOfBirth as string)
                    : "-"}
                </td>
                <td>{row.startDate.slice(0, 10)}</td>
                <td>{row.endDate.slice(0, 10)}</td>
                <td>{row.employmentType}</td>
                {showCanidateHolder && <td>{row.consultantName}</td>}
                {showActions && (
                  <td>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 1,
                      }}
                    >
                      {/* {handleEdit && (
                        <Tooltip size="sm" title="Edit" placement="left">
                          <IconButton
                            size="sm"
                            color="neutral"
                            onClick={() => handleEdit(row.cuid)}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      )} */}
                      {handleDelete && (
                        <Tooltip size="sm" title="Delete" placement="right">
                          <IconButton
                            size="sm"
                            color="danger"
                            onClick={() => handleDelete([row.cuid])}
                            disabled={
                              user.permission !==
                              PermissionList.CAN_EDIT_ALL_PROJECTS
                            }
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </Box>
  );
};

export default CandidateTable;
