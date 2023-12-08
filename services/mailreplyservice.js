async function autoReplyAndMoveToLabel(gmail) {
  try {
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
    });

    const messages = response.data.messages;

    // console.log(messages);

    if (!messages || messages.length === 0) {
      return "No unread emails to reply to.";
    }

    const labelId = await createLabelIfNeeded(gmail, "VacayResponder");

    const processEmail = async (messageId, threadId) => {
      const replied = await hasRepliedToEmail(gmail, threadId);

      if (!replied) {
        const replyMessage =
          "This mail is being auto replied to by VacayResponder";
        await replyToEmail(gmail, messageId, replyMessage);
        await moveToLabel(gmail, threadId, labelId);
      } else {
        await markEmailAsRead(gmail, threadId);
      }
    };

    // Process each email in series to avoid API rate limits
    //   messages.reduce((p, message) => {
    //     return p.then(() => {
    //       return new Promise((resolve) => {
    //         processEmail(message.id);
    //         resolve();
    //       });
    //     });
    //   }, Promise.resolve());

    await processEmail(messages[0].id, messages[0].threadId);
  } catch (err) {
    throw err;
  }
}

// Function to create a label if it doesn't exist
async function createLabelIfNeeded(gmail, labelName) {
  try {
    const response = await gmail.users.labels.list({
      userId: "me",
    });

    const labels = response.data.labels;
    const existingLabel = labels.find((label) => label.name === labelName);
    if (existingLabel) {
      return existingLabel.id;
    } else {
      const response = await gmail.users.labels.create({
        userId: "me",
        resource: {
          name: labelName,
        },
      });
      return response.data.id;
    }
  } catch (err) {
    throw err;
  }
}

// Function to check if you've previously replied to an email
async function hasRepliedToEmail(gmail, messageId) {
  try {
    console.log(messageId);
    const response = await gmail.users.threads.get({
      userId: "me",
      id: messageId,
    });

    // console.log(response);

    const thread = response.data;
    const messages = thread.messages;
    return messages.length > 1;
  } catch (err) {
    throw err;
  }
}

// Function to reply to an email
async function replyToEmail(gmail, messageId, replyMessage) {
  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const originalMessage = response.data;
    const threadId = originalMessage.threadId; // Get the thread ID of the original message

    const replyData = {
      raw: "",
    };
    replyData.raw = `To: ${
      originalMessage.payload.headers.find((header) => header.name === "From")
        .value
    }\r\n`; // Reply to the original sender
    replyData.raw += `Subject: Re: ${
      originalMessage.payload.headers.find(
        (header) => header.name === "Subject"
      ).value
    }\r\n`; // Include "Re:" in the subject
    replyData.raw += `In-Reply-To: <${threadId}>\r\n`; // Use the thread ID for In-Reply-To
    replyData.raw += `References: <${threadId}>\r\n`; // Include the thread ID in References
    replyData.raw += 'Content-Type: text/plain; charset="UTF-8"\r\n';
    replyData.raw += "\r\n";
    replyData.raw += replyMessage;

    await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: Buffer.from(replyData.raw).toString("base64"),
        threadId: threadId,
      },
    });
  } catch (err) {
    throw err;
  }
}

// Function to move an email to a label
async function moveToLabel(gmail, threadId, labelId) {
  try {
    gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      resource: {
        addLabelIds: [labelId],
      },
    });
  } catch (err) {
    throw err;
  }
}

// Function to mark emails with more than 1 reply and unread as read
async function markEmailAsRead(gmail, threadId) {
  try {
    gmail.users.threads.modify({
      userId: "me",
      id: threadId,
      resource: {
        removeLabelIds: ["UNREAD"], // Remove the UNREAD label to mark as read
      },
    });
  } catch (err) {
    throw err;
  }
}

module.exports = {
  autoReplyAndMoveToLabel,
};
