import axios from "axios";
import dayjs from "dayjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRequestContext } from "../../providers/requestContextProvider";
import LoadingRequestButton from "../../components/LoadingRequestButton";
import FileUpload from "../../components/InputFileUpload";

import {
  Typography,
  FormControl,
  FormLabel,
  Grid,
  Input,
  Sheet,
} from "@mui/joy";

export default function MedicalLeaveForm({
  setIsOpen,
}: {
  setIsOpen: (isOpen: boolean) => void;
}) {
  const { updateRequest } = useRequestContext();

  const [startDate, setStartDate] = useState<string>(
    dayjs().format("YYYY-MM-DD")
  );
  const [numberOfDays, setNumberOfDays] = useState("1");

  const [mcFile, setMcFile] = useState<File | null>(null);
  const [mcPreview, setMcPreview] = useState("");

  const handleMcFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      setMcFile(selectedFile);

      if (mcPreview) {
        URL.revokeObjectURL(mcPreview);
      }

      const previewURL = URL.createObjectURL(selectedFile);
      setMcPreview(previewURL);
    }
  };

  const handleClaimSubmit = async () => {
    const formData = new FormData();
    formData.append("startDate", startDate);
    formData.append("numberOfDays", numberOfDays);
    formData.append("mc", mcFile!);

    try {
      const response = await axios.post(`/api/user/request/mc`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status === 200) {
        setIsOpen(false);
        updateRequest();
        toast.success("Leave request submitted successfully");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occured while submitting your leave request");
    }
  };

  return (
    <>
      <Grid container spacing={2}>
        <Grid xs={12} sm={6}>
          <FormControl>
            <FormLabel>Start Date</FormLabel>
            <Input
              type="date"
              value={startDate}
              slotProps={{
                input: {
                  max: dayjs().add(1, "day").format("YYYY-MM-DD"),
                },
              }}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormControl>
        </Grid>

        <Grid xs={12} sm={6}>
          <FormControl>
            <FormLabel>Number of days</FormLabel>
            <Input
              value={numberOfDays}
              type="number"
              slotProps={{
                input: {
                  min: 1,
                },
              }}
              onKeyDown={(e) => {
                if (e.key === "e" || e.key === "-") {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                if (!e.target.value) {
                  setNumberOfDays("");
                  return;
                }

                const duration = parseInt(e.target.value);
                if (duration > 0) {
                  setNumberOfDays(e.target.value);
                  return;
                }

                setNumberOfDays("1");
              }}
              endDecorator={<Typography>days</Typography>}
            />
          </FormControl>
        </Grid>
      </Grid>
      <FormControl>
        <FileUpload
          label="Upload MC"
          hasFile={!!mcFile}
          setState={handleMcFileChange}
        />
      </FormControl>
      {mcPreview && (
        <Sheet sx={{ overflowY: "auto", width: "100%" }}>
          <img
            src={mcPreview}
            alt="Image preview"
            style={{ width: "100%", height: "auto" }}
          />
        </Sheet>
      )}

      <Typography level="body-xs" sx={{ mt: 1 }}>
        Note: Pending leave requests in this period will be cancelled.
      </Typography>
      <LoadingRequestButton
        promise={handleClaimSubmit}
        disabled={!startDate || !numberOfDays || !mcFile}
      />
    </>
  );
}
