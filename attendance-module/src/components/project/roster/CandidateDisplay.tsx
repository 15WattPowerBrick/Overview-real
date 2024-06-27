import { Grid, Typography } from "@mui/joy";
import { Dayjs } from "dayjs";
import DayBin from "./DayBin";
import { Roster } from "../../../types/common";

function getLatestDate(...dates: Dayjs[]) {
  return dates.reduce((acc, date) => (date.isAfter(acc) ? date : acc));
}

function getEarliestDate(...dates: Dayjs[]) {
  return dates.reduce((acc, date) => (date.isBefore(acc) ? date : acc));
}

export default function CandidateDisplay({
  name,
  cuid,
  currentRoster,
  startDate,
  endDate,
  firstDay,
  lastDay,
  projectStartDate,
  projectEndDate,
  updateRosterData,
}: {
  name: string;
  cuid: string;
  currentRoster: Roster[];
  startDate: Dayjs;
  endDate: Dayjs;
  firstDay: Dayjs;
  lastDay: Dayjs;
  projectStartDate: Dayjs;
  projectEndDate: Dayjs;
  updateRosterData: () => void;
}) {
  const disabledTo = getLatestDate(
    projectStartDate,
    firstDay.endOf("day").subtract(1, "day")
  );

  const disabledFrom = getEarliestDate(
    projectEndDate,
    lastDay.startOf("day").add(1, "day")
  );

  return (
    <Grid container>
      <Grid xs={5} sm={3} md={2} display="flex" justifyContent="flex-start" alignItems="center">
        <Typography
          pl={1}
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </Typography>
      </Grid>
      <Grid
        xs={7}
        sm={9}
        md={10}
        container
        display="flex"
        direction="row"
        columns={endDate.diff(startDate, "days") + 1}
      >
        {Array.from({ length: endDate.diff(startDate, "days") + 1 }).map(
          (_, index) => {
            const date = startDate.add(index + 1, "days");
            return (
              <Grid xs={1} key={`${cuid} ${index}`}>
                <DayBin
                  date={date}
                  candidateCuid={cuid}
                  currentRoster={currentRoster.filter((roster) =>
                    date.isSame(roster.startTime, "day")
                  )}
                  disabled={
                    date.isBefore(disabledTo) ||
                    date.isSame(disabledFrom) ||
                    date.isAfter(disabledFrom)
                  }
                  updateRosterData={updateRosterData}
                />
              </Grid>
            );
          }
        )}
      </Grid>
    </Grid>
  );
}
