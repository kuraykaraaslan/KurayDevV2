'use client';
import React, { useEffect, Suspense, useState } from "react";
import axiosInstance from "@/libs/axios";
import  { ContributionDay, Week, Weeks, GraphQLRes } from "@/types/GitTypes";

const HeatMap = () => {

    const [weeks, setWeeks] = useState<Weeks>([]); 

    
    useEffect(() => {
        axiosInstance.get("/api/sections/github").then((response) => {
            const data: GraphQLRes = response.data;
            console.log(data);
            setWeeks(data.user.contributionsCollection.contributionCalendar.weeks);
        }).catch((error) => {
            console.error(error);
        });

        if (weeks.length === 0) {
            return;
        }

    }, []);



    return (
        <div className="flex flex-col items-center justify-center">
            <div id="contributions" className="flex gap-1">
                {weeks.map((week, i) => {
                    return (
                        <div key={i} className="relative grid grid-row-7 space-y-1">
                            {week?.contributionDays.map((day, j) => {
                                const isToday = day.date === new Date().toISOString().slice(0, 10);
                                return (
                                    <div key={j} className="relative w-4 h-4 bg-base-200 border border-base-200 shadow"
                                    title={`${day.date} - ${day.contributionCount} contributions`} >
                                        <div
                                            className="absolute w-4 h-4 bg-base-200"
                                            style={{
                                                opacity: day.date === "0" ? 0 : 1,
                                            }}
                                        ></div>
                                        <div
                                            className={"absolute w-4 h-4 bg-primary " + (isToday ? "animate-pulse" : "")}
                                            style={{
                                                opacity: isToday ? 1 : day.date === "0" ? 0 : day.contributionCount / 3,
                                            }}
                                        ></div>
                                    </div>

                                );
                            })}

                        </div>
                    );
                })}
            </div>
        </div>
    );
};


export default HeatMap;