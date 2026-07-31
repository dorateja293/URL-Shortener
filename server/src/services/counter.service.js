import Counter from "../models/counter.model.js";

const getNextSequence = async (counterName) => {
    const counter = await Counter.findOneAndUpdate(
        { name: counterName },
        { $inc: { seq: 1 } },
        {
            new: true,
            upsert: true,
        }
    );

    return counter.seq;
};

export default getNextSequence;