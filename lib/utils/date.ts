import {format} from "@formkit/tempo"


export const formatGermanyDate = (date: Date) => {
	const formatted =  format(date,"YYYY/MM/DD")
	return formatted

} 