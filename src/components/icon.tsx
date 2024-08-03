import { JSX, splitProps } from "solid-js"

export default function Icon(props: { colored?: boolean; icon: string } & JSX.IntrinsicElements["div"]) {
  const [{ icon, colored }, divProps] = splitProps(props, ["icon", "colored"])

  if (colored)
    return (
      <div
        {...divProps}
        style={{
          "background-size": "cover",
          "background-image": `url("${icon}")`,
        }}
      />
    )
  return (
    <div
      {...divProps}
      style={{
        "mask-image": `url("${icon}")`,
        "mask-size": "cover",
        "-webkit-mask-image": `url("${icon}")`,
      }}
    />
  )
}
