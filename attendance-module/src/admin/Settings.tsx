import { useState } from "react";
import GeneralProjectSettings from "../components/project/manage/GeneralProjectSettings";
import ManageProjectAccess from "../components/project/manage/ManageProjectAccess";

import {
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemDecorator,
  ListItemContent,
  Grid,
  Typography,
} from "@mui/joy";
import { Build, MenuBook, Notifications, Group } from "@mui/icons-material";

const sections = [
  {
    title: "General",
    icon: <MenuBook />,
    children: <GeneralProjectSettings />,
  },
  {
    title: "Access",
    icon: <Group />,
    children: <ManageProjectAccess />,
  },
  {
    title: "Notifications",
    icon: <Notifications />,
    children: <div>Notifications</div>,
  },
  {
    title: "Advanced",
    icon: <Build />,
    children: <div>Advanced</div>,
  },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState(0);

  return (
    <Grid container spacing={2} sx={{ flexGrow: 1 }}>
      <Grid xs={12} lg={2}>
        <List>
          {sections.map((section, index) => (
            <ListItem
              key={index}
              onClick={() => setActiveSection(index)}
              sx={{
                cursor: "pointer",
              }}
              variant={index === activeSection ? "soft" : "plain"}
            >
              <ListItemButton sx={{ gap: 0 }}>
                <ListItemDecorator>{section.icon}</ListItemDecorator>
                <ListItemContent>
                  <Typography level="title-sm">{section.title}</Typography>
                </ListItemContent>
              </ListItemButton>
            </ListItem>
          ))}
          <Divider />
        </List>
      </Grid>
      <Grid xs={12} lg={10}>
        {sections[activeSection].children}
      </Grid>
    </Grid>
  );
};

export default Settings;
