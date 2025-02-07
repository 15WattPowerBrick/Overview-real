import axios from "axios";
import dayjs, { Dayjs } from "dayjs";
import L from "leaflet";
import toast from "react-hot-toast";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useRef } from "react";
import { correctTimes } from "../../utils/date-time";
import { CommonLocation, getAttendanceResponse } from "../../types/common";

import Clock from "./Clock";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import Webcam from "react-webcam";

import {
  Box,
  Button,
  Divider,
  Stack,
  Typography,
  Card,
  Modal,
  ModalDialog,
  CircularProgress,
  CardOverflow,
  CardActions,
} from "@mui/joy";
import {
  CameraAltRounded as CameraAltIcon,
  LocationOnRounded as LocationOnIcon,
} from "@mui/icons-material";

const ClockIn = () => {
  const isDarkMode = localStorage.getItem("joy-mode") === "dark";

  const [currAttendance, setCurrAttendance] = useState<
    getAttendanceResponse | undefined
  >(undefined);
  const [projLocations, setProjLocations] = useState<CommonLocation[]>([]);
  const [startTime, setStartTime] = useState<Dayjs | undefined>(undefined);
  const [endTime, setEndTime] = useState<Dayjs | undefined>(undefined);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(true);
  const [currLatitude, setCurrLatitude] = useState<number | null>(null);
  const [currLongitude, setCurrLongitude] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | undefined>(undefined);
  const [nearestLocation, setNearestLocation] = useState<
    CommonLocation | undefined
  >(undefined);

  const [isPictureModalOpen, setIsPictureModalOpen] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const [isClockOutModalOpen, setIsClockOutModalOpen] = useState(false);

  const fetchAttendance = () => {
    axios
      .get("/api/user/attendance")
      .then((response) => {
        const att = getCurrAttendance(response.data);
        setCurrAttendance(att);
        if (!att) return;

        setProjLocations(att.Shift.Project.locations);

        const { correctStart, correctEnd } = correctTimes(
          dayjs(att.shiftDate),
          att.shiftType === "SECOND_HALF"
            ? dayjs(att.Shift.halfDayStartTime)
            : dayjs(att.Shift.startTime),
          att.shiftType === "FIRST_HALF"
            ? dayjs(att.Shift.halfDayEndTime)
            : dayjs(att.Shift.endTime)
        );

        setStartTime(correctStart);
        setEndTime(correctEnd);
      })
      .catch((error) => console.error(error));
  };

  useEffect(() => {
    fetchAttendance();

    // refetch every 5 minutes
    const intervalId = setInterval(fetchAttendance, 5 * 60 * 1000);
    return () => clearInterval(intervalId); // Cleanup the interval on component unmount
  }, []);

  const isWithinStartTimeRange = () => {
    if (!currAttendance || !startTime) {
      return false;
    }

    return (
      dayjs().diff(startTime, "minute") >=
      -currAttendance.Shift.Project.timeWindow
    );
  };

  const isWithinEndTimeRange = () => {
    if (!currAttendance || !endTime) {
      return false;
    }

    return (
      dayjs().diff(endTime, "minute") < currAttendance.Shift.Project.timeWindow
    );
  };

  useEffect(() => {
    if (!currLatitude || !currLongitude || projLocations.length === 0) {
      setDistance(undefined);
      setNearestLocation(undefined);
      return;
    }

    const getDistance = (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ) => {
      const R = 6371e3; // Radius of the earth in meters
      const dLat = deg2rad(lat2 - lat1);
      const dLon = deg2rad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
          Math.cos(deg2rad(lat2)) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const d = R * c; // Distance in meters
      return d;
    };

    let nearest = projLocations[0];
    let minDistance = getDistance(
      currLatitude,
      currLongitude,
      parseFloat(nearest.latitude),
      parseFloat(nearest.longitude)
    );

    for (let i = 1; i < projLocations.length; i++) {
      const location = projLocations[i];
      const distance = getDistance(
        currLatitude,
        currLongitude,
        parseFloat(location.latitude),
        parseFloat(location.longitude)
      );

      if (distance < minDistance) {
        nearest = location;
        minDistance = distance;
      }
    }

    setNearestLocation(nearest);
    setDistance(
      getDistance(
        currLatitude,
        currLongitude,
        parseFloat(nearest.latitude),
        parseFloat(nearest.longitude)
      )
    );
  }, [currLatitude, currLongitude, projLocations]);

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180);
  };

  const blueIcon = new L.Icon({
    iconUrl: "/Images/marker-icon-2x-blue.png",
    shadowUrl: "/Images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const redIcon = new L.Icon({
    iconUrl: "/Images/marker-icon-2x-red.png",
    shadowUrl: "/Images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });

  const handleGetLocation = () => {
    setIsFetchingLocations(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrLatitude(pos.coords.latitude);
        setCurrLongitude(pos.coords.longitude);
        setIsFetchingLocations(false);
      },
      () => {
        toast.error("Failed to obtain location data.");
        setIsFetchingLocations(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCheckLocation = () => {
    if (!currAttendance) {
      toast.error("No upcoming shift.");
      return;
    }

    if (!projLocations || projLocations.length === 0) {
      toast.error("No site locations found.");
      return;
    }

    if (!currLatitude || !currLongitude) {
      toast.error("Unable to retrieve current location.");
      return;
    }

    if (!nearestLocation || !distance) {
      toast.error("Unable to retrieve nearest location.");
      return;
    }

    const radius = currAttendance.Shift.Project.distanceRadius;
    if (distance > radius) {
      toast.error(`More than ${radius} meters from nearest location.`);
      return;
    }

    setIsLocationModalOpen(false);
    setIsPictureModalOpen(true);
  };

  const handleCaptureImageOrRetake = () => {
    if (capturedImage) {
      setCapturedImage(null);
      return;
    }

    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      } else {
        toast.error("Failed to capture image, please try again.");
        return;
      }
    }
  };

  const handleClockIn = () => {
    if (!currAttendance) {
      toast.error("No upcoming shift.");
      return;
    }

    const body = {
      attendanceCuid: currAttendance.cuid,
      candidateCuid: currAttendance.candidateCuid,
      clockInTime: dayjs(),
      imageData: capturedImage,
      startTime: startTime,
      location: nearestLocation,
    };

    // update attendance in database
    axios
      .patch("/api/user/attendance", body)
      .then(() => {
        toast.success("Successfully clocked in!", { duration: 10000 });
        setIsPictureModalOpen(false);

        // update local state
        setCurrAttendance({
          ...currAttendance,
          clockInTime: dayjs().toISOString(),
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to record attendance. Please try again.", {
          duration: 10000,
        });
      });
  };

  const handleAttemptClockOut = () => {
    if (!currAttendance || !currAttendance.clockInTime) {
      toast.error("Not clocked in yet.");
      return;
    }

    if (!isWithinEndTimeRange()) {
      toast.error("Not within clock-out time range.");
      setTimeout(() => window.location.reload(), 5000);
      return;
    }

    setIsClockOutModalOpen(true);
  };

  const handleClockOut = () => {
    if (!currAttendance || !currAttendance.clockInTime) {
      toast.error("Not clocked in yet.");
      return;
    }

    const body = {
      attendanceCuid: currAttendance.cuid,
      clockOutTime: dayjs(),
    };

    // update attendance in database
    axios
      .patch("/api/user/attendance", body)
      .then(() => {
        toast.success("Succesfully clocked out!", { duration: 10000 });
        setIsClockOutModalOpen(false);

        fetchAttendance();
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to record attendance. Please try again.", {
          duration: 10000,
        });
      });
  };

  return (
    <>
      <Stack
        spacing={4}
        sx={{
          display: "flex",
          maxWidth: "800px",
          mx: "auto",
        }}
      >
        <Card>
          <Box sx={{ mb: 1 }}>
            <Typography level="title-md">Clock</Typography>
            <Typography level="body-sm">
              Singapore Standard Time SGT (UTC+08:00)
            </Typography>
          </Box>
          <Divider />
          <Stack spacing={2} sx={{ my: 1 }}>
            <Clock />
          </Stack>
          <CardOverflow sx={{ borderTop: "1px solid", borderColor: "divider" }}>
            <CardActions
              sx={{
                alignSelf: "flex-start",
                pt: 2,
                flexDirection: "column",
                alignItems: "flex-start",
              }}
            >
              <Typography level="body-sm">
                Before clocking in or out, ensure that
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LocationOnIcon />
                <Typography level="body-sm" sx={{ ml: 1 }}>
                  Location access is enabled
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CameraAltIcon />
                <Typography level="body-sm" sx={{ ml: 1 }}>
                  Camera access is enabled
                </Typography>
              </Box>
            </CardActions>
          </CardOverflow>
        </Card>
      </Stack>
      {!currAttendance && (
        <Box
          sx={{
            pt: "15px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography level="title-sm">No upcoming shifts</Typography>
        </Box>
      )}

      {currAttendance && (
        <Stack
          spacing={4}
          sx={{
            pt: "15px",
            display: "flex",
            maxWidth: "800px",
            mx: "auto",
          }}
        >
          <Card>
            <Box sx={{ mb: 1 }}>
              {currAttendance.clockInTime ? (
                <Typography level="title-md">Current shift</Typography>
              ) : (
                <Typography level="title-md">
                  Upcoming shift {startTime?.fromNow()}
                </Typography>
              )}
              <Typography level="body-sm">
                {currAttendance.Shift.Project.name}
              </Typography>
            </Box>
            <Divider />
            <Stack spacing={2} sx={{ my: 1 }}>
              <>
                <Box>
                  <Typography level="body-sm">Shift time</Typography>
                  <Typography level="body-md">
                    {startTime?.format("h:mm A")} - {endTime?.format("h:mm A")}
                  </Typography>
                  <Typography level="body-sm">Shift date</Typography>
                  <Typography level="body-md">
                    {dayjs(currAttendance.shiftDate).format(
                      "dddd, MMMM DD YYYY"
                    )}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
                  <Button
                    fullWidth
                    onClick={() => {
                      if (!currLatitude || !currLongitude) {
                        handleGetLocation();
                      }
                      setIsLocationModalOpen(true);
                    }}
                    disabled={
                      !currAttendance ||
                      Boolean(currAttendance.clockInTime) ||
                      !isWithinStartTimeRange()
                    }
                  >
                    Clock-In
                  </Button>
                  <Button
                    fullWidth
                    onClick={handleAttemptClockOut}
                    disabled={!currAttendance.clockInTime}
                  >
                    Clock-Out
                  </Button>
                </Box>
              </>
            </Stack>
            <CardOverflow
              sx={{ borderTop: "1px solid", borderColor: "divider" }}
            >
              <CardActions
                sx={{
                  alignSelf: "flex-start",
                  pt: 2,
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <Typography level="body-sm">
                  Clock in / out within{" "}
                  {currAttendance.Shift.Project.timeWindow} mins of shift time.
                </Typography>
              </CardActions>
            </CardOverflow>
          </Card>
        </Stack>
      )}

      <Modal
        open={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      >
        <ModalDialog sx={{ width: "600px" }}>
          {currLatitude && currLongitude ? (
            <>
              <MapContainer
                center={[currLatitude, currLongitude]}
                zoom={14}
                style={{ height: "400px", width: "100%" }}
                minZoom={12}
                maxZoom={17}
              >
                <TileLayer
                  url={
                    "https://www.onemap.gov.sg/maps/tiles/" +
                    (isDarkMode ? "Night" : "Default") +
                    "/{z}/{x}/{y}.png"
                  }
                  attribution='<img src="https://www.onemap.gov.sg/web-assets/images/logo/om_logo.png" style="height:20px;width:20px;"/>&nbsp;<a href="https://www.onemap.gov.sg/" target="_blank" rel="noopener noreferrer">OneMap</a>&nbsp;&copy;&nbsp;contributors&nbsp;&#124;&nbsp;<a href="https://www.sla.gov.sg/" target="_blank" rel="noopener noreferrer">Singapore Land Authority</a>'
                  detectRetina={true}
                />

                {currLatitude && currLongitude && (
                  <Marker
                    icon={blueIcon}
                    position={[currLatitude, currLongitude]}
                  >
                    <Popup>
                      <Typography level="body-sm">Your location</Typography>
                    </Popup>
                  </Marker>
                )}

                {projLocations.length > 0 &&
                  projLocations.map((loc) => (
                    <Marker
                      key={loc.name}
                      icon={redIcon}
                      position={[
                        parseFloat(loc.latitude),
                        parseFloat(loc.longitude),
                      ]}
                    >
                      <Popup>
                        <Typography level="body-sm">{loc.name}</Typography>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            </>
          ) : (
            <Card
              sx={{
                height: "400px",
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
              }}
              variant="soft"
            />
          )}

          <Typography level="title-sm">
            {projLocations.length > 0
              ? nearestLocation && distance
                ? `Nearest location: ${
                    nearestLocation.name
                  } (${distance.toFixed(2)}m away)`
                : "Fetching location..."
              : "No site locations found"}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <Button
              onClick={handleGetLocation}
              disabled={isFetchingLocations}
              fullWidth
            >
              {isFetchingLocations ? <CircularProgress /> : "Update Location"}
            </Button>
            <Button
              onClick={handleCheckLocation}
              disabled={isFetchingLocations}
              fullWidth
            >
              Continue
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      <Modal
        open={isPictureModalOpen}
        onClose={() => setIsPictureModalOpen(false)}
      >
        <ModalDialog sx={{ width: "400px" }}>
          <div style={{ position: "relative", width: "100%", height: "360px" }}>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{
                width: 360,
                height: 360,
                facingMode: "user",
              }}
              style={{ width: "100%", height: "100%" }}
            />
            {capturedImage && (
              <img
                src={capturedImage}
                alt="smile!"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Button fullWidth onClick={handleCaptureImageOrRetake}>
              {capturedImage ? "Retake" : "Capture"}
            </Button>
            <Button fullWidth onClick={handleClockIn} disabled={!capturedImage}>
              Submit
            </Button>
          </Box>
        </ModalDialog>
      </Modal>

      <Modal
        open={isClockOutModalOpen}
        onClose={() => setIsClockOutModalOpen(false)}
      >
        <ModalDialog>
          <Typography level="title-sm">Clock Out</Typography>
          <Typography level="body-sm">
            Are you sure you want to clock out? <br />
            This action cannot be undone.
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              fullWidth
              onClick={() => setIsClockOutModalOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button fullWidth onClick={handleClockOut} color="danger">
              Confirm
            </Button>
          </Box>
        </ModalDialog>
      </Modal>
    </>
  );
};

const getCurrAttendance = (attendanceData: getAttendanceResponse[]) => {
  const currAttendance = attendanceData.find((attendance) => {
    if (attendance.clockOutTime) {
      return false;
    }

    if (attendance.leave === "FULLDAY") return false;

    if (attendance.status === "MEDICAL") return false;

    const { correctEnd } = correctTimes(
      dayjs(attendance.shiftDate),
      dayjs(attendance.Shift.startTime),
      dayjs(attendance.Shift.endTime)
    );

    const cutoff = correctEnd.add(
      attendance.Shift.Project.timeWindow,
      "minute"
    );
    return dayjs().diff(cutoff) <= 0;
  });

  return currAttendance;
};

export default ClockIn;
