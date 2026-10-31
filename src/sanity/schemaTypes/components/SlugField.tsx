import { Card, Flex, Text } from '@sanity/ui';
import {
	getPublishedId,
	type ObjectFieldProps,
	type SlugValue,
	useEditState,
	useFormValue,
} from 'sanity';

import { resolveHref } from '@/sanity/lib/site';

// These render on the about site (vomatt-about); the rest, like Log In, on the app (vomatt-web)
const ABOUT_SITE_TYPES = ['pHome', 'pGeneral'];

// The Studio runs on the admin app, so pages live on a public site's origin
export function getUrl({
	docType,
	slug,
}: {
	docType: string | undefined;
	slug: string | undefined;
}) {
	const siteUrl = ABOUT_SITE_TYPES.includes(docType ?? '')
		? process.env.NEXT_PUBLIC_ABOUT_URL
		: process.env.NEXT_PUBLIC_SITE_URL;
	const href = resolveHref({ documentType: docType, slug });
	if (!siteUrl || !href) return undefined;

	return new URL(href, siteUrl).toString();
}

export const SlugField = (props: ObjectFieldProps<SlugValue>) => {
	const { children, title, description, value } = props;
	const docType = useFormValue([`_type`]) as string | undefined;
	const docId = useFormValue([`_id`]) as string | undefined;
	// The site only serves published content, so link to the published slug
	const { published } = useEditState(getPublishedId(docId ?? ''), docType ?? '');
	const publishedSlug = (published?.slug as SlugValue | undefined)?.current;

	const pageUrl = published
		? getUrl({ docType, slug: publishedSlug })
		: undefined;

	return (
		<Card tone={(value?.current?.length ?? 0) > 15 ? 'caution' : 'positive'}>
			<Card paddingY={2}>
				<Flex>
					<Card flex={1}>
						<Text size={1} weight="semibold">
							{title}
						</Text>
					</Card>
					{pageUrl && (
						<Flex>
							<Text size={1} weight="semibold">
								<a href={pageUrl} target="_blank" rel="noreferrer">
									View page
								</a>
							</Text>
						</Flex>
					)}
				</Flex>
			</Card>
			<Card paddingTop={1} paddingBottom={2}>
				<Text size={1} muted>
					{description}
				</Text>
			</Card>
			<Card>{children}</Card>
		</Card>
	);
};
