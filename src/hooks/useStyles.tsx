import { makeStyles } from "@material-ui/core"

const useStyles = makeStyles({
  problemsButton: {
    backgroundColor: "#BF0000",
    marginLeft: "10px !important",
  },
  runButton: {
    backgroundColor: "#0275d8",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#0275d8",
      color: "#228B22",
    },
  },
  stopButton: {
    backgroundColor: "#0275d8",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#0275d8",
      color: "#F44141",
    },
  },
  testButton: {
    backgroundColor: "#EBEBEB",
    color: "#FF7518",
    marginLeft: "10px !important",
    "&:hover": {
      backgroundColor: "#D5D5D5",
      color: "#FF7518",
    },
  },
  normalButton: {
    backgroundColor: "#EBEBEB",
    marginLeft: "10px !important",
    "&:hover": {
      backgroundColor: "#D5D5D5",
    },
  },
  blueButton: {
    margin: "5px",
    backgroundColor: "#0275d8",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#0275d8",
    },
  },
  darkButton: {
    margin: "5px",
    backgroundColor: "#696969",
    color: "#FFF",
    "&:hover": {
      backgroundColor: "#808080",
    },
    "&:disabled": {
      backgroundColor: "#A9A9A9",
    },
  },
  whiteText: {
    color: "#FFF",
    paddingLeft: "5px",
  },
  allTestsPassedPaper: {
    borderLeft: "10px solid #4caf50",
    margin: "5px",
    padding: "10px",
    "& h2": {
      color: "#4caf50",
    },
  },
})

export default useStyles
