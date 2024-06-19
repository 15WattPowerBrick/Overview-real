import { ChangeEvent, useEffect, useState } from "react";
import axios from "axios";
import { CssVarsProvider } from "@mui/joy/styles";
import CssBaseline from "@mui/joy/CssBaseline";
import Box from "@mui/joy/Box";
import UpcomingShifts from "./UpcomingShifts";
import UpcomingShiftsM from "./UpcomingShiftsM";
import { CustomAttendance } from "../../../types";
import { iconButtonClasses } from "@mui/joy/IconButton";
import { Button, FormControl, FormLabel, Input } from "@mui/joy";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowLeftIcon from "@mui/icons-material/KeyboardArrowLeft";
import SearchIcon from "@mui/icons-material/Search";
import dayjs from "dayjs";

type Page = {
  isFirstPage: boolean;
  isLastPage: boolean;
  currentPage: number;
  previousPage: number | null;
  nextPage: number | null;
  pageCount: number;
  totalCount: number;
};

const ViewShifts = () => {
  const [data, setData] = useState<CustomAttendance[]>([]);
  const [page, setPage] = useState<Page>({
    isFirstPage: true,
    isLastPage: true,
    currentPage: 1,
    previousPage: null,
    nextPage: null,
    pageCount: 1,
    totalCount: 0,
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedDate = event.target.value;
    if (selectedDate) {
      const formattedDate = dayjs(selectedDate).toISOString();
      setSelectedDate(formattedDate);
    } else {
      setSelectedDate(null);
    }
  };

  useEffect(() => {
    if (selectedDate !== null) {
      fetchUpcomingShifts(1, selectedDate);
    } else {
      fetchUpcomingShifts(1);
    }
  }, [selectedDate]);

  const fetchUpcomingShifts = async (page: number, date?: string) => {
    try {
      let url = `/api/user/upcoming/${page}`;
      if (date) {
        const formattedDate = dayjs(date).format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
        url += `?date=${formattedDate}`;
      }
      const response = await axios.get(url);
      const [fetchedData, paginationData] = response.data;
      setData(fetchedData);
      setPage(paginationData);
    } catch (error) {
      console.error("Error fetching upcoming shifts: ", error);
    }
  };

  useEffect(() => {
    fetchUpcomingShifts(page.currentPage);
  }, [page.currentPage]);

  const handleNextPage = () => {
    if (!page.isLastPage && page.nextPage !== null) {
      fetchUpcomingShifts(page.nextPage);
    }
  };

  const handlePreviousPage = () => {
    if (!page.isFirstPage && page.previousPage !== null) {
      fetchUpcomingShifts(page.previousPage);
    }
  };

  return (
    <CssVarsProvider disableTransitionOnChange>
      <CssBaseline />
      <Box sx={{ display: "flex" }}>
        <Box
          component="main"
          className="MainContent"
          sx={{
            px: { xs: 2, md: 6 },
            pb: { xs: 2, sm: 2, md: 3 },
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            gap: 1,
          }}
        >
          <Box
            className="SearchAndFilters-tabletUp"
            sx={{
              borderRadius: "sm",
              py: 2,
              flexWrap: "wrap",
              gap: 1.5,
              "& > *": {
                minWidth: { xs: "120px", md: "160px" },
              },
            }}
          >
            <FormControl sx={{ flex: 1 }} size="sm">
              <FormLabel>Search for shift</FormLabel>
              <Input
                type="date"
                size="sm"
                placeholder="Search"
                startDecorator={<SearchIcon />}
                onChange={handleDateChange}
              />
            </FormControl>
          </Box>
          <UpcomingShifts data={data} />
          <UpcomingShiftsM data={data} />

          <Box
            className="Pagination-laptopUp"
            sx={{
              pt: 2,
              gap: 1,
              [`& .${iconButtonClasses.root}`]: { borderRadius: "50%" },
              display: {
                xs: "flex",
                md: "flex",
              },
            }}
          >
            <Button
              size="sm"
              variant="outlined"
              color="neutral"
              startDecorator={<KeyboardArrowLeftIcon />}
              onClick={handlePreviousPage}
              disabled={page.isFirstPage}
            >
              Previous
            </Button>

            <Box sx={{ flex: 1 }} />
            <Button size="sm" variant="outlined" color="neutral">
              {page.currentPage} / {page.pageCount}
            </Button>
            <Box sx={{ flex: 1 }} />

            <Button
              size="sm"
              variant="outlined"
              color="neutral"
              endDecorator={<KeyboardArrowRightIcon />}
              onClick={handleNextPage}
              disabled={page.isLastPage}
            >
              Next
            </Button>
          </Box>
        </Box>
      </Box>
    </CssVarsProvider>
  );
};

export default ViewShifts;
