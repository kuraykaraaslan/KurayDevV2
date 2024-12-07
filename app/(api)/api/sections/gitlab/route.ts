"use server";

import { NextResponse } from "next/server";
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { GraphQLRes } from '@/types/GitTypes'

type ResponseData = {
    message: string
}

export async function GET(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
    //https://api.github.com/graphql

    const url = 'https://gitlab.com/api/graphql'

    const token = process.env.GITLAB_TOKEN;
    const username = process.env.GITLAB_USER as string;

    const query: string = `
    {
        user(login: "${username}") {
            contributionsCollection {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            color
                            contributionCount
                            date
                            weekday
                        }
                        firstDay
                    }
                }
            }
        }
    }
    `
    return axios.post(url, { query }, {
        headers: {
            Authorization: `bearer ${token}`
        }
    }).then((response) => {
        const data: GraphQLRes = response.data;
        return NextResponse.json({ message: 'Success', data } as ResponseData) 
        
        
        }

    ).catch((error) => {
        return NextResponse.json({ message: 'Error', error }, { status: 500 })
    }

    )

}




