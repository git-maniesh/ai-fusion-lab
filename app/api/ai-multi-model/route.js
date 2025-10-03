import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { model, msg, parentModel } = req.body;

  try {
    const response = await axios.post(
      "https://kravixstudio.com/api/v1/chat",
      {
        message: msg,
        aiModel: model,
        outputType: "text",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.KRAVIX_STUDIO_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const aiResponse = response.data.output || "No response from AI";

    res.status(200).json({ aiResponse, model: parentModel });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ aiResponse: "Error Fetching Response", model: parentModel });
  }
}
