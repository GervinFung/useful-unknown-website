import fs from 'fs-extra';

import { sleepInSeconds } from '@poolofdeath20/util';

import * as puppeteer from 'puppeteer';

const getMoreComments = async (page: puppeteer.Page) => {
	while (true) {
		await sleepInSeconds({
			seconds: 2,
		});

		await page.evaluate(() => {
			window.scrollTo(0, window.document.body.scrollHeight);
		});

		const button = await page.evaluate(() => {
			const button = Array.from(
				document.getElementsByTagName('button')
			).find((button) => {
				return button.className.includes('button-brand');
			});

			button?.click();

			return button;
		});

		if (!button) {
			break;
		}
	}
};

const main = async () => {
	const browser = await puppeteer.launch({ headless: false });

	const page = await browser.newPage();

	await page.goto(
		'https://www.reddit.com/r/AskReddit/comments/q2viki/what_useful_unknown_website_do_you_wish_more',
		{
			waitUntil: 'networkidle0',
		}
	);

	await page.evaluate(() => {
		window.scrollTo(0, window.document.body.scrollHeight);
	});

	await getMoreComments(page);

	const data = await page.evaluate(() => {
		return Array.from(document.getElementsByTagName('shreddit-comment'))
			.flatMap((comment) => {
				const actions = Array.from(
					comment.children.item(3)?.children ?? []
				);

				//@ts-ignore
				const upvotes = comment.__score;

				if (!upvotes) {
					return [];
				}

				const share = actions.at(1);

				if (!share) {
					return [];
				}

				const commentContent = comment.children
					.item(2)
					?.children.item(0)
					?.innerHTML?.replace(' ugc', '')
					.replace(/class=".*?"/gm, '')
					.split('\n')
					.map((line) => {
						return line.trim();
					})
					.join('\n');

				if (!commentContent) {
					return [];
				}

				// @ts-ignore
				const permalink = share.__permalink;

				if (typeof permalink !== 'string') {
					throw new Error('permalink is not a string');
				}

				return [
					{
						commentContent,
						permalink,
						upvotes,
					},
				];
			})
			.map((data) => {
				return {
					...data,
					permalink: `https://www.reddit.com${data.permalink}`,
					upvotes: parseInt(data.upvotes),
				};
			})
			.filter((data) => {
				return (
					data.upvotes > 0 &&
					!data.commentContent.includes('Comment deleted by user')
				);
			});
	});

	await fs.outputFile(
		'src/data.js',
		`const data = ${JSON.stringify(data, null, 4)}; export default data;`
	);

	await browser.close();
};

main();
