import { Week } from "@prisma/client";
import { Router } from "express";
import { connect } from "http2";
import prisma from "../config/prisma";
import { weekData } from "../prisma/weekData";

const jobsRouter = Router();

interface Job {
  jobTitle: string;
  date: string;
  startTime: string;
  endTime: string;
  slots: number;
  filledSlots: number;
  weekId: number;
}

jobsRouter
  .get("/", async (req, res) => {
    try {
      const jobs = await prisma.job.findMany();

      if (!jobs) {
        res
          .status(404)
          .json({ error: true, msg: "Cannot find any jobs *panic* " });
        return;
      }

      return res.status(200).json(jobs);
    } catch (error) {
      console.log("error ===", error);
      res.status(404).json({ error: true, msg: error });
    }
  })
  .post("/", async (req, res) => {
    try {
      const {
        jobTitle,
        date,
        startTime,
        endTime,
        availableSlots,
      } = req.body;
      const availableSlot:number = +availableSlots;
      const  weekId = await prisma.week.findUnique({
        select:{
          id:true,
        },
        where:{
          weekDate :date
        }
      })
      var id: any ;
      if(weekId) { id = weekId?.id;
      const updatedWeek = await prisma.week.update({
        where: { id: id },
        data: {
          openSlots: {
            increment: availableSlot,
          },
        },
      }); }
      if(!weekId) {const  Week = await prisma.week.create({
        data: {
          weekDate: date,
          openSlots: availableSlot,
          filledSlots: 0,
        },
        select:{
          id:true,
        }
      });id = Week?.id;}
      
      console.log(req.body, "weekId", weekId);
      const job: Job = await prisma.job.create({
        data: {
          jobTitle: jobTitle,
          date: date,
          startTime: startTime,
          endTime: endTime,
          slots: availableSlot,
          filledSlots: 0,
          weekId: id,
        },
      });
      return res
        .status(200)
        .json({ msg: "Week added successfully!", data: job });
    } catch (error) {
      console.log("error ===", error);
      res.status(404).json({ error: true, msg: error });
    }
  })
  .get("/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const job = await prisma.job.findUnique({
        where: { id: parseInt(id) },
        include: { week: true },
      });

      if (!job) {
        res.status(404).json({ error: true, msg: "Cannot find this job :(" });
        return;
      }

      res.status(200).json({ msg: "Job added successfully!", data: job });
    } catch (error) {
      console.log("error ===", error);
      res.status(404).json({ error: true, msg: error });
    }
  })
  .delete("/:id", async (req, res) => {
    try {
      const { id } = req.body;
      const selected = await prisma.job.findUnique({
        where: { id: parseInt(id) },
      });
      if (!selected) {
        res.status(404).json({ error: true, msg: "Cannot find this job" });
        return;
      }
      res.status(200).json({ msg: "job deleted successfully!" });
    } catch (err) {
      res.status(404).json({ error: true, msg: err });
    }
  });

export default jobsRouter;
